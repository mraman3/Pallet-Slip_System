// Client Apis
import { Router } from "express";
import { prisma } from "../../prisma";
import { Prisma } from "@prisma/client";

const router = Router();

// ---CLIENT APIS---
// GET /api/clients - search clients for Sold To dropdown
// Example: GET /api/clients?search=ab
router.get("/", async (req, res) => {
  try {
    const search = (req.query.search as string) || "";
    const includeInactive = req.query.includeInactive === "true" || req.query.includeInactive === "1";

    const where: Prisma.ClientWhereInput = {};

    if (!includeInactive) {
      where.active = true;
    }

    if (search.trim()) {
      where.name = {
        contains: search.trim(),
        mode: "insensitive",
      };
    }

    const clients = await prisma.client.findMany({
      where,
      orderBy: [{ active: "desc" }, { name: "asc" }],
      take: 50, // limit for dropdown
    });

    res.json(clients);
  } catch (error) {
    console.error("Error fetching clients", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/clients - create a new client (Sold To)
// Body JSON:
// {
//   "name": "ABC Lumber Inc.",
//   "address": "123 Industrial Rd",
//   "city": "Brampton",
//   "province": "ON",
//   "postal": "L6T 1A1",
// }
router.post("/", async (req, res) => {
  try {
    const {
      name,
      address,
      city,
      province,
      postal,
    } = req.body;

    // basic validation
    if (!name || !address || !city || !province || !postal) {
      return res.status(400).json({
        error: "name, address, city, province, and postal are required",
      });
    }

    const client = await prisma.client.create({
      data: {
        name,
        address,
        city,
        province,
        postal,
      },
    });

    res.status(201).json(client);
  } catch (error) {
    console.error("Error creating client", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/clients/:id - update a client's info
router.put("/:id", async (req, res) => {
  try {
    const clientId = Number(req.params.id);

    const { name, address, city, province, postal } = req.body;

    // Validate required fields
    if (!name || !address || !city || !province || !postal) {
      return res.status(400).json({
        error: "name, address, city, province, and postal are required",
      });
    }

    const updated = await prisma.client.update({
      where: { id: clientId },
      data: { name, address, city, province, postal },
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating client", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/clients/:id/disable - soft delete (set active = false)
router.patch("/:id/disable", async (req, res) => {
  try {
    const clientId = Number(req.params.id);

    const updated = await prisma.client.update({
      where: { id: clientId },
      data: { active: false },
    });

    res.json({ message: "Client disabled", client: updated });
  } catch (error) {
    console.error("Error disabling client", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/clients/:id/enable - re-enable a client
router.patch("/:id/enable", async (req, res) => {
  try {
    const clientId = Number(req.params.id);

    const updated = await prisma.client.update({
      where: { id: clientId },
      data: { active: true },
    });

    res.json({ message: "Client enabled", client: updated });
  } catch (error) {
    console.error("Error enabling client", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;