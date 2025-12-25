import type { Page } from "puppeteer";
import { getBrowser } from "./getBrowser";

const MAX_POOL_SIZE = 2;
const pagePool: Page[] = [];

// --- telemetry counters ---
let createdCount = 0;
let reusedCount = 0;
let returnedCount = 0;
let closedCount = 0;

/**
 * Acquire a Puppeteer page.
 * Reuses a pooled page when available, otherwise creates a new one.
 */
export const acquirePage = async (): Promise<Page> => {
  const browser = await getBrowser();

  if (pagePool.length > 0) {
    reusedCount++;
    return pagePool.pop()!;
  }

  createdCount++;
  return browser.newPage();
};

/**
 * Release a Puppeteer page.
 * Resets and returns it to the pool if space allows,
 * otherwise closes it.
 */
export const releasePage = async (page: Page) => {
  try {
    await page.goto("about:blank", { waitUntil: "domcontentloaded" });

    if (pagePool.length < MAX_POOL_SIZE) {
      pagePool.push(page);
      returnedCount++;
      return;
    }
  } catch {
    // page was bad
  }

  try {
    await page.close();
    closedCount++;
  } catch {
    /* ignore */
  }
};

/**
 * Pool Status Snapshot
 */
export const getPoolStats = () => {
  return {
    maxPoolSize: MAX_POOL_SIZE,
    currentPoolSize: pagePool.length,

    created: createdCount,
    reused: reusedCount,
    returnedToPool: returnedCount,
    closedDestroyed: closedCount,
  };
};
