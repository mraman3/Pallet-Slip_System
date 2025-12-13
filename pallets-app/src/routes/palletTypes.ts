// src/routes/palletTypes.ts
import { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import { Prisma } from "@prisma/client";

const router = Router();

/**
 * GET /api/pallet-types
 * Optional: ?search=string
 * Used for the Description dropdown on the slip.
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const search = (req.query.search as string) || "";
    const includeInactive =
      req.query.includeInactive === "true" || req.query.includeInactive === "1";

    const where: Prisma.PalletTypeWhereInput = {};

    // only filter active when inactive are NOT requested
    if (!includeInactive) {
      where.active = true;
    }

    if (search.trim()) {
      where.name = {
        contains: search.trim(),
        mode: "insensitive",
      };
    }

    const palletTypes = await prisma.palletType.findMany({
      where,
      orderBy: [{ active: "desc" }, { name: "asc" }],
      take: 50,
    });

    res.json(palletTypes);
  } catch (error) {
    console.error("Error fetching pallet types", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


/**
 * POST /api/pallet-types
 * Body: { "name": "48x40 4-way stringer" }
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }

    const created = await prisma.palletType.create({
      data: { name },
    });

    res.status(201).json(created);
  } catch (error) {
    console.error("Error creating pallet type", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PUT /api/pallet-types/:id
 * Update pallet type name
 * Body: { "name": "New Name" }
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const palletTypeId = Number(req.params.id);
    const { name } = req.body;

    if (Number.isNaN(palletTypeId)) {
      return res.status(400).json({ error: "Invalid pallet type id" });
    }

    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }

    const updated = await prisma.palletType.update({
      where: { id: palletTypeId },
      data: { name },
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating pallet type", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/pallet-types/:id/disable
 * Soft delete (active = false)
 */
router.patch("/:id/disable", async (req: Request, res: Response) => {
  try {
    const palletTypeId = Number(req.params.id);

    if (Number.isNaN(palletTypeId)) {
      return res.status(400).json({ error: "Invalid pallet type id" });
    }

    const updated = await prisma.palletType.update({
      where: { id: palletTypeId },
      data: { active: false },
    });

    res.json({ message: "Pallet type disabled", palletType: updated });
  } catch (error) {
    console.error("Error disabling pallet type", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/pallet-types/:id/enable
 * Re-enable (active = true)
 */
router.patch("/:id/enable", async (req: Request, res: Response) => {
  try {
    const palletTypeId = Number(req.params.id);

    if (Number.isNaN(palletTypeId)) {
      return res.status(400).json({ error: "Invalid pallet type id" });
    }

    const updated = await prisma.palletType.update({
      where: { id: palletTypeId },
      data: { active: true },
    });

    res.json({ message: "Pallet type enabled", palletType: updated });
  } catch (error) {
    console.error("Error enabling pallet type", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
