import { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import { Prisma } from "@prisma/client";

const router = Router();

/**
 * GET /api/slips
 * - slip_number: string
 * - client_id: number
 * - clerk_id: number
 * - ship_to_address_id: number
 * - shipped_via: string (e.g. "BPI" or "P/U")
 * - customer_order: string (substring search)
 * - from_date, to_date: ISO dates for slip "date"
 * - from_date_shipped, to_date_shipped: ISO dates for "date_shipped"
 * - limit: max number of results (default 100)
 *
 * Returns a paginated list of slips with optional filters.
 *
 * Supports:
 * - Text filters (slip number, customer order)
 * - Foreign key filters (client, clerk, ship-to, pallet type)
 * - Date range filters (date, date_shipped)
 * - Pagination via limit + offset
 *
 * Response shape:
 * {
 *   data: SlipWithRelations[],
 *   total: number
 * }
 *
 * IMPORTANT:
 * - `total` represents the total number of matching slips WITHOUT pagination
 * - `data` represents only the current page
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    // -------------------------
    // Extract query parameters
    // -------------------------
    const {
      slip_number,
      client_id,
      clerk_id,
      ship_to_address_id,
      shipped_via,
      customer_order,
      from_date,
      to_date,
      from_date_shipped,
      to_date_shipped,
      pallet_type_id,
      limit,
      offset,
    } = req.query as Record<string, string>;

    // -------------------------
    // Build Prisma WHERE clause
    // -------------------------
    // This object accumulates all optional filters.
    // Only provided filters are applied.
    const where: Prisma.SlipWhereInput = {};

    // Slip number substring search (case-insensitive)
    if (slip_number) {
      where.slip_number = {
        contains: slip_number,
        mode: "insensitive",
      };
    }

    // Client filter
    if (client_id) {
      const id = Number(client_id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ error: "client_id must be a number" });
      }
      where.client_id = id;
    }

    // Clerk filter
    if (clerk_id) {
      const id = Number(clerk_id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ error: "clerk_id must be a number" });
      }
      where.clerk_id = id;
    }

    // Ship-to address filter
    if (ship_to_address_id) {
      const id = Number(ship_to_address_id);
      if (Number.isNaN(id)) {
        return res
          .status(400)
          .json({ error: "ship_to_address_id must be a number" });
      }
      where.ship_to_address_id = id;
    }

    // Shipped via filter (restricted to known values)
    if (shipped_via) {
      const valid = ["BPI", "P/U"];
      if (!valid.includes(shipped_via)) {
        return res.status(400).json({
          error: "shipped_via must be 'BPI' or 'P/U'",
        });
      }
      where.shipped_via = shipped_via;
    }

    // Customer order substring search
    if (customer_order) {
      where.customer_order = {
        contains: customer_order,
        mode: "insensitive",
      };
    }

    // -------------------------
    // Date range filters
    // -------------------------

    // Filter by slip date
    if (from_date || to_date) {
      const dateFilter: Prisma.DateTimeFilter = {};

      if (from_date) {
        const d = new Date(from_date);
        if (Number.isNaN(d.getTime())) {
          return res.status(400).json({ error: "Invalid from_date" });
        }
        dateFilter.gte = d;
      }

      if (to_date) {
        const d = new Date(to_date);
        if (Number.isNaN(d.getTime())) {
          return res.status(400).json({ error: "Invalid to_date" });
        }
        dateFilter.lte = d;
      }

      where.date = dateFilter;
    }

    // Filter by shipped date (nullable field)
    if (from_date_shipped || to_date_shipped) {
      const shippedFilter: Prisma.DateTimeNullableFilter = {};

      if (from_date_shipped) {
        const d = new Date(from_date_shipped);
        if (Number.isNaN(d.getTime())) {
          return res.status(400).json({ error: "Invalid from_date_shipped" });
        }
        shippedFilter.gte = d;
      }

      if (to_date_shipped) {
        const d = new Date(to_date_shipped);
        if (Number.isNaN(d.getTime())) {
          return res.status(400).json({ error: "Invalid to_date_shipped" });
        }
        shippedFilter.lte = d;
      }

      where.date_shipped = shippedFilter;
    }

    // Filter slips that contain at least one item
    // with the specified pallet type
    if (pallet_type_id) {
      const id = Number(pallet_type_id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ error: "pallet_type_id must be a number" });
      }

      where.items = {
        some: {
          pallet_type_id: id,
        },
      };
    }

    // -------------------------
    // Pagination parameters
    // -------------------------
    // Defaults ensure safety and backward compatibility.
    const take = Math.min(Number(limit) || 25, 100); // max page size = 100
    const skip = Math.max(Number(offset) || 0, 0);   // never allow negative offset

    // -------------------------
    // Query total count
    // -------------------------
    // IMPORTANT:
    // This query does NOT use take/skip.
    // It represents the full result set size.
    const total = await prisma.slip.count({ where });

    // -------------------------
    // Query paginated data
    // -------------------------
    const data = await prisma.slip.findMany({
      where,
      orderBy: [
        { created_at: "desc" },
        { id: "desc" }, // tie-breaker safety
      ], // REQUIRED for stable pagination
      skip,
      take,
      include: {
        client: true,
        ship_to_address: true,
        clerk: true,
        items: {
          include: {
            pallet_type: true,
          },
        },
      },
    });

    // -------------------------
    // Final response
    // -------------------------
    res.json({
      data,
      total,
    });
  } catch (error) {
    console.error("Error listing slips", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



/**
 * GET /api/slips/:id
 * Returns slip + client + ship_to_address + clerk + items + pallet types
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const slipId = Number(req.params.id);
    if (Number.isNaN(slipId)) {
      return res.status(400).json({ error: "Invalid slip id" });
    }

    const slip = await prisma.slip.findUnique({
      where: { id: slipId },
      include: {
        client: true,
        ship_to_address: true,
        clerk: true,
        items: {
          include: {
            pallet_type: true,
          },
        },
      },
    });

    if (!slip) {
      return res.status(404).json({ error: "Slip not found" });
    }

    res.json(slip);
  } catch (error) {
    console.error("Error fetching slip", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      client_id,
      ship_to_address_id,
      clerk_id,
      date,
      customer_order,
      date_shipped,
      shipped_via,
      comments_line1,
      comments_line2,
      items,
    } = req.body;

    // ---- 1) Basic required fields & types ----
    if (
      !client_id ||
      !ship_to_address_id ||
      !clerk_id ||
      !date ||
      !customer_order ||
      !shipped_via
    ) {
      return res.status(400).json({
        error:
          "client_id, ship_to_address_id, clerk_id, date, customer_order, and shipped_via are required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one item is required" });
    }

    const clientId = Number(client_id);
    const shipToId = Number(ship_to_address_id);
    const clerkId = Number(clerk_id);

    if (
      Number.isNaN(clientId) ||
      Number.isNaN(shipToId) ||
      Number.isNaN(clerkId)
    ) {
      return res.status(400).json({
        error:
          "client_id, ship_to_address_id, and clerk_id must be valid numbers",
      });
    }

    // Optional: restrict shipped_via to known values
    const allowedShippedVia = ["BPI", "P/U"] as const;
    if (!allowedShippedVia.includes(shipped_via)) {
      return res.status(400).json({
        error: "shipped_via must be 'BPI' or 'P/U'",
      });
    }

    // Validate dates
    const mainDate = new Date(date);
    if (Number.isNaN(mainDate.getTime())) {
      return res.status(400).json({ error: "Invalid date" });
    }

    const shippedDate = date_shipped ? new Date(date_shipped) : null;
    if (date_shipped && Number.isNaN(shippedDate!.getTime())) {
      return res
        .status(400)
        .json({ error: "Invalid date_shipped value" });
    }

    // ---- 2) Prepare items (and collect pallet_type_ids) ----
    const itemRows = items.map((item: any, index: number) => {
      const palletTypeId = Number(item.pallet_type_id);

      if (Number.isNaN(palletTypeId)) {
        throw new Error(
          `Invalid item at index ${index}: pallet_type_id must be a number`
        );
      }

      const qtyOrdered = String(item.qty_ordered ?? "");
      const qtyShipped = String(item.qty_shipped ?? "");

      if (!qtyOrdered || !qtyShipped) {
        throw new Error(
          `Invalid item at index ${index}: qty_ordered and qty_shipped are required`
        );
      }

      return {
        pallet_type_id: palletTypeId,
        qty_ordered: qtyOrdered,
        qty_shipped: qtyShipped,
      };
    });

    const palletTypeIds = Array.from(
      new Set(itemRows.map((row) => row.pallet_type_id))
    );

    // ---- 3) Business rule checks (DB lookups) ----

    // 3a) Client must exist and be active
    const client = await prisma.client.findFirst({
      where: { id: clientId, active: true },
    });
    if (!client) {
      return res
        .status(400)
        .json({ error: "Client not found or inactive" });
    }

    // 3b) Ship-to address must exist, belong to client, and be active
    const shipTo = await prisma.clientAddress.findFirst({
      where: {
        id: shipToId,
        client_id: clientId,
        active: true,
      },
    });
    if (!shipTo) {
      return res.status(400).json({
        error:
          "Ship-to address not found for this client or is inactive",
      });
    }

    // 3c) Clerk must exist and be active
    const clerk = await prisma.clerk.findFirst({
      where: { id: clerkId, active: true },
    });
    if (!clerk) {
      return res
        .status(400)
        .json({ error: "Clerk not found or inactive" });
    }

    // 3d) All pallet types in items must exist and be active
    const palletTypes = await prisma.palletType.findMany({
      where: {
        id: { in: palletTypeIds },
        active: true,
      },
      select: { id: true },
    });

    if (palletTypes.length !== palletTypeIds.length) {
      const foundIds = new Set(palletTypes.map((p) => p.id));
      const missing = palletTypeIds.filter((id) => !foundIds.has(id));
      return res.status(400).json({
        error: `One or more pallet types are invalid or inactive: [${missing.join(
          ", "
        )}]`,
      });
    }

    const createdSlip = await prisma.$transaction(async (tx) => {
      // 1) Atomically increment counter
      const counter = await tx.slipCounter.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          nextNum: 1,
        },
        update: {
          nextNum: { increment: 1 },
        },
        select: {
          nextNum: true,
        },
      });

      const slipNumber = String(counter.nextNum);

      // 2) Create slip
      const slip = await tx.slip.create({
        data: {
          slip_number: slipNumber,
          client_id: clientId,
          ship_to_address_id: shipToId,
          clerk_id: clerkId,
          date: mainDate,
          customer_order,
          date_shipped: shippedDate,
          shipped_via,
          comments_line1: comments_line1 || null,
          comments_line2: comments_line2 || null,
        },
      });

      // 3) Create items
      await tx.slipItem.createMany({
        data: itemRows.map((row) => ({
          ...row,
          slip_id: slip.id,
        })),
      });

      return slip;
    });

    // ---- 7) Fetch full slip with relations to return ----
    const fullSlip = await prisma.slip.findUnique({
      where: { id: createdSlip.id },
      include: {
        client: true,
        ship_to_address: true,
        clerk: true,
        items: {
          include: {
            pallet_type: true,
          },
        },
      },
    });

    res.status(201).json(fullSlip);
  } catch (error: any) {
    console.error("Error creating slip", error);
    res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
});


/**
 * PUT /api/slips/:id
 * Update slip header + items
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const slipIdParam = req.params.id;
    const slipId = Number(slipIdParam);

    if (Number.isNaN(slipId)) {
      return res.status(400).json({ error: "Invalid slip id" });
    }

    const existingSlip = await prisma.slip.findUnique({
      where: { id: slipId },
    });

    if (!existingSlip) {
      return res.status(404).json({ error: "Slip not found" });
    }

    const {
      client_id,
      ship_to_address_id,
      clerk_id,
      date,
      customer_order,
      date_shipped,
      shipped_via,
      comments_line1,
      comments_line2,
      items,
    } = req.body;

    // ---- 1) Basic required fields & types ----
    if (
      !client_id ||
      !ship_to_address_id ||
      !clerk_id ||
      !date ||
      !customer_order ||
      !shipped_via
    ) {
      return res.status(400).json({
        error:
          "client_id, ship_to_address_id, clerk_id, date, customer_order, and shipped_via are required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one item is required" });
    }

    const clientId = Number(client_id);
    const shipToId = Number(ship_to_address_id);
    const clerkId = Number(clerk_id);

    if (
      Number.isNaN(clientId) ||
      Number.isNaN(shipToId) ||
      Number.isNaN(clerkId)
    ) {
      return res.status(400).json({
        error:
          "client_id, ship_to_address_id, and clerk_id must be valid numbers",
      });
    }

    // Optional: restrict shipped_via to known values
    const allowedShippedVia = ["BPI", "P/U"] as const;
    if (!allowedShippedVia.includes(shipped_via)) {
      return res.status(400).json({
        error: "shipped_via must be 'BPI' or 'P/U'",
      });
    }

    // Validate dates
    const mainDate = new Date(date);
    if (Number.isNaN(mainDate.getTime())) {
      return res.status(400).json({ error: "Invalid date" });
    }

    const shippedDate = date_shipped ? new Date(date_shipped) : null;
    if (date_shipped && Number.isNaN(shippedDate!.getTime())) {
      return res
        .status(400)
        .json({ error: "Invalid date_shipped value" });
    }

    // ---- 2) Prepare items (and collect pallet_type_ids) ----
    const itemRows = items.map((item: any, index: number) => {
      const palletTypeId = Number(item.pallet_type_id);

      if (Number.isNaN(palletTypeId)) {
        throw new Error(
          `Invalid item at index ${index}: pallet_type_id must be a number`
        );
      }

      const qtyOrdered = String(item.qty_ordered ?? "");
      const qtyShipped = String(item.qty_shipped ?? "");

      if (!qtyOrdered || !qtyShipped) {
        throw new Error(
          `Invalid item at index ${index}: qty_ordered and qty_shipped are required`
        );
      }

      return {
        pallet_type_id: palletTypeId,
        qty_ordered: qtyOrdered,
        qty_shipped: qtyShipped,
      };
    });

    const palletTypeIds = Array.from(
      new Set(itemRows.map((row) => row.pallet_type_id))
    );

    // ---- 3) Business rule checks (DB lookups) ----

    // 3a) Client must exist and be active
    const client = await prisma.client.findFirst({
      where: { id: clientId, active: true },
    });
    if (!client) {
      return res
        .status(400)
        .json({ error: "Client not found or inactive" });
    }

    // 3b) Ship-to address must exist, belong to client, and be active
    const shipTo = await prisma.clientAddress.findFirst({
      where: {
        id: shipToId,
        client_id: clientId,
        active: true,
      },
    });
    if (!shipTo) {
      return res.status(400).json({
        error:
          "Ship-to address not found for this client or is inactive",
      });
    }

    // 3c) Clerk must exist and be active
    const clerk = await prisma.clerk.findFirst({
      where: { id: clerkId, active: true },
    });
    if (!clerk) {
      return res
        .status(400)
        .json({ error: "Clerk not found or inactive" });
    }

    // 3d) All pallet types in items must exist and be active
    const palletTypes = await prisma.palletType.findMany({
      where: {
        id: { in: palletTypeIds },
        active: true,
      },
      select: { id: true },
    });

    if (palletTypes.length !== palletTypeIds.length) {
      const foundIds = new Set(palletTypes.map((p) => p.id));
      const missing = palletTypeIds.filter((id) => !foundIds.has(id));
      return res.status(400).json({
        error: `One or more pallet types are invalid or inactive: [${missing.join(
          ", "
        )}]`,
      });
    }

    // ---- 4) Update slip + items in a transaction ----
    const updatedSlip = await prisma.$transaction(async (tx) => {
      // Update slip header (keep slip_number the same)
      await tx.slip.update({
        where: { id: slipId },
        data: {
          client_id: clientId,
          ship_to_address_id: shipToId,
          clerk_id: clerkId,
          date: mainDate,
          customer_order,
          date_shipped: shippedDate,
          shipped_via,
          comments_line1: comments_line1 || null,
          comments_line2: comments_line2 || null,
        },
      });

      // Replace items
      await tx.slipItem.deleteMany({
        where: { slip_id: slipId },
      });

      await tx.slipItem.createMany({
        data: itemRows.map((row) => ({
          ...row,
          slip_id: slipId,
        })),
      });

      // Return full slip with relations
      return tx.slip.findUnique({
        where: { id: slipId },
        include: {
          client: true,
          ship_to_address: true,
          clerk: true,
          items: {
            include: {
              pallet_type: true,
            },
          },
        },
      });
    });

    if (!updatedSlip) return res.status(500).json({ error: "Failed to update slip" });
    res.json(updatedSlip);
  } catch (error: any) {
    console.error("Error updating slip", error);
    res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
});

export default router;
