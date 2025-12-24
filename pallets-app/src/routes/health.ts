// src/routes/health.ts
import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "../prisma";

const router = Router();

/**
 * GET /healthz
 *
 * Lightweight health check used by:
 * - Render health checks
 * - Your own monitoring
 *
 * Checks:
 * - Process is alive
 * - DB is reachable (very fast SELECT 1)
 */
router.get("/healthz", async (_req: Request, res: Response) => {
  const started = Date.now();

  try {
    // Very cheap DB round-trip
    await prisma.$queryRaw`SELECT 1`;

    const dbMs = Date.now() - started;

    return res.status(200).json({
      status: "ok",
      db: "up",
      dbMs,
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV ?? "unknown",
    });
  } catch (err) {
    console.error("[/healthz] DB check failed:", err);

    return res.status(500).json({
      status: "error",
      db: "unreachable",
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
