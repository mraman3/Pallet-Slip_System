// src/routes/addresses.ts
import { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import { Prisma } from "@prisma/client";

// mergeParams: true lets us read :clientId from the parent route
const router = Router({ mergeParams: true });

/**
 * GET /api/clients/:clientId/addresses
 * Optional: ?search=string (filters by location_name or address)
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const params = req.params as { clientId?: string };
    const clientId = Number(params.clientId);
    const search = (req.query.search as string) || "";
    const includeInactive = req.query.includeInactive === "true" || req.query.includeInactive === "1";

    if (Number.isNaN(clientId)) {
      return res.status(400).json({ error: "Invalid clientId" });
    }

    const where: Prisma.ClientAddressWhereInput = {
      client_id: clientId,
    };

    if (!includeInactive) where.active = true;

    if (search.trim()) {
      where.OR = [
        { location_name: { contains: search.trim(), mode: "insensitive" } },
        { address: { contains: search.trim(), mode: "insensitive" } },
        { city: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const addresses = await prisma.clientAddress.findMany({
      where,
      orderBy: [{ active: "desc" }, { location_name: "asc" }],
      take: 20,
    });

    res.json(addresses);
  } catch (error) {
    console.error("Error fetching addresses", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/clients/:clientId/addresses
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const params = req.params as { clientId?: string };
    const clientId = Number(params.clientId);
    const { location_name, address, city, province, postal } = req.body;

    if (Number.isNaN(clientId)) {
      return res.status(400).json({ error: "Invalid clientId" });
    }

    if (!location_name || !address || !city || !province || !postal) {
      return res.status(400).json({
        error:
          "location_name, address, city, province, and postal are required",
      });
    }

    const created = await prisma.clientAddress.create({
      data: {
        client_id: clientId,
        location_name,
        address,
        city,
        province,
        postal,
      },
    });

    res.status(201).json(created);
  } catch (error) {
    console.error("Error creating address", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PUT /api/clients/:clientId/addresses/:id
 * Update address fields (client_id stays the same)
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const params = req.params as { clientId?: string; id?: string };
    const clientId = Number(params.clientId);
    const addressId = Number(params.id);
    const { location_name, address, city, province, postal } = req.body;

    if (Number.isNaN(clientId) || Number.isNaN(addressId)) {
      return res.status(400).json({ error: "Invalid clientId or address id" });
    }

    if (!location_name || !address || !city || !province || !postal) {
      return res.status(400).json({
        error:
          "location_name, address, city, province, and postal are required",
      });
    }

    // 1) Check that this address really belongs to this client
    const existing = await prisma.clientAddress.findUnique({
      where: { id: addressId },
    });

    if (!existing || existing.client_id !== clientId) {
      return res
        .status(404)
        .json({ error: "Address not found for this client" });
    }

    // 2) Now it's safe to update
    const updated = await prisma.clientAddress.update({
      where: { id: addressId },
      data: {
        location_name,
        address,
        city,
        province,
        postal,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating address", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/clients/:clientId/addresses/:id/disable
 * Soft delete address (active = false)
 */
router.patch("/:id/disable", async (req: Request, res: Response) => {
  try {
    const params = req.params as { clientId?: string; id?: string };
    const cid = Number(params.clientId)
    const addressId = Number(params.id)

    if (Number.isNaN(addressId)) {
      return res.status(400).json({ error: "Invalid address id" });
    }

    const existing = await prisma.clientAddress.findUnique({ where: { id: addressId } });
    if (!existing || existing.client_id !== cid) {
      return res.status(404).json({ error: "Address not found for this client" });
    }

    const updated = await prisma.clientAddress.update({
      where: { id: addressId },
      data: { active: false },
    });

    res.json({ message: "Address disabled", address: updated });
  } catch (error) {
    console.error("Error disabling address", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/clients/:clientId/addresses/:id/enable
 * Re-enable address (active = true)
 */
router.patch("/:id/enable", async (req: Request, res: Response) => {
  try {
    const params = req.params as { clientId?: string; id?: string };
    const cid = Number(params.clientId)
    const addressId = Number(params.id)

    if (Number.isNaN(addressId)) {
      return res.status(400).json({ error: "Invalid address id" });
    }

    const existing = await prisma.clientAddress.findUnique({ where: { id: addressId } });
    if (!existing || existing.client_id !== cid) {
      return res.status(404).json({ error: "Address not found for this client" });
    }

    const updated = await prisma.clientAddress.update({
      where: { id: addressId },
      data: { active: true },
    });

    res.json({ message: "Address enabled", address: updated });
  } catch (error) {
    console.error("Error enabling address", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
