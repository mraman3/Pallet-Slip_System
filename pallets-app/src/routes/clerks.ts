// src/routes/clerks.ts
import { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import { Prisma } from "@prisma/client";

const router = Router();


/* GET /api/clerks
 * Optional: ?search=string
 * List active clerks for dropdown
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const search = (req.query.search as string) || "";

    const where: Prisma.ClerkWhereInput = {
      active: true,
    };

    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    const clerks = await prisma.clerk.findMany({
      where,
      orderBy: { name: "asc" },
      take: 50,
    });

    res.json(clerks);
  } catch (error) {
    console.error("Error fetching clerks", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


/**
 * POST /api/clerks
 * Create a new clerk
 * Body: { "name": "John Doe" }
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }

    const clerk = await prisma.clerk.create({
      data: { name },
    });

    res.status(201).json(clerk);
  } catch (error) {
    console.error("Error creating clerk", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PUT /api/clerks/:id
 * Update clerk name
 * Body: { "name": "New Name" }
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const clerkId = Number(req.params.id);
    const { name } = req.body;

    if (Number.isNaN(clerkId)) {
      return res.status(400).json({ error: "Invalid clerk id" });
    }

    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }

    const updated = await prisma.clerk.update({
      where: { id: clerkId },
      data: { name },
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating clerk", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/clerks/:id/disable
 * Soft delete (active = false)
 */
router.patch("/:id/disable", async (req: Request, res: Response) => {
  try {
    const clerkId = Number(req.params.id);

    if (Number.isNaN(clerkId)) {
      return res.status(400).json({ error: "Invalid clerk id" });
    }

    const updated = await prisma.clerk.update({
      where: { id: clerkId },
      data: { active: false },
    });

    res.json({ message: "Clerk disabled", clerk: updated });
  } catch (error) {
    console.error("Error disabling clerk", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/clerks/:id/enable
 * Re-enable (active = true)
 */
router.patch("/:id/enable", async (req: Request, res: Response) => {
  try {
    const clerkId = Number(req.params.id);

    if (Number.isNaN(clerkId)) {
      return res.status(400).json({ error: "Invalid clerk id" });
    }

    const updated = await prisma.clerk.update({
      where: { id: clerkId },
      data: { active: true },
    });

    res.json({ message: "Clerk enabled", clerk: updated });
  } catch (error) {
    console.error("Error enabling clerk", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
