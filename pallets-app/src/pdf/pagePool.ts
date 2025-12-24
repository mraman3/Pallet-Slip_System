// src/pdf/pagePool.ts
import type { Page } from "puppeteer";
import { getBrowser } from "./getBrowser";

const MAX_POOL_SIZE = 2;
const pagePool: Page[] = [];

/**
 * Acquire a Puppeteer page.
 * Reuses a pooled page when available, otherwise creates a new one.
 */
export const acquirePage = async (): Promise<Page> => {
  const browser = await getBrowser();

  if (pagePool.length > 0) {
    return pagePool.pop()!;
  }

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
      return;
    }
  } catch {
    // page is unusable
  }

  try {
    await page.close();
  } catch {
    /* ignore */
  }
};
