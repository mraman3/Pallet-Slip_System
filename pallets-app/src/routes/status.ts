import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "../prisma";
import { getBrowser } from "../pdf/getBrowser";
import { getPoolStats } from "../pdf/pagePool";

const router = Router();

router.get("/status", async (_req: Request, res: Response) => {
  const started = Date.now();

  let dbStatus = "unknown";
  let dbLatency = null;

  try {
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - t0;
    dbStatus = "up";
  } catch {
    dbStatus = "down";
  }

  let browserStatus = "unknown";
  let browserVersion = null;

  try {
    const browser = await getBrowser();
    browserStatus = "running";
    browserVersion = await browser.version();
  } catch {
    browserStatus = "failed";
  }

  const pool = getPoolStats();

  return res.json({
    status: "ok",
    timestamp: new Date().toISOString(),

    uptimeSeconds: Math.floor(process.uptime()),

    db: {
      status: dbStatus,
      latencyMs: dbLatency,
    },

    puppeteer: {
      status: browserStatus,
      version: browserVersion,
    },

    pagePool: pool,

    responseTimeMs: Date.now() - started,
  });
});

export default router;
