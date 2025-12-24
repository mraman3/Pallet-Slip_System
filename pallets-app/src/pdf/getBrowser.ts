// src/pdf/getBrowser.ts
import puppeteer from "puppeteer";
import type { Browser } from "puppeteer";

// Runs ONCE per container when module is loaded
console.log("📦 getBrowser module loaded");

// Module-level singleton
let browser: Browser | null = null;

/**
 * Graceful shutdown hook.
 * Fires when Render stops the container (idle, deploy, restart).
 */
process.on("SIGTERM", async () => {
  console.log("🛑 SIGTERM received");

  if (browser) {
    try {
      await browser.close();
      console.log("🛑 Puppeteer browser closed on shutdown");
    } catch (err) {
      console.error("⚠️ Error closing Puppeteer browser", err);
    }
  }
});

/**
 * Returns a shared Puppeteer Browser instance.
 */
export const getBrowser = async (): Promise<Browser> => {
  if (browser) return browser;

  const launchOptions: Parameters<typeof puppeteer.launch>[0] = {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  };

  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOptions.executablePath =
      process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const t0 = Number(process.hrtime.bigint() / 1_000_000n);
  browser = await puppeteer.launch(launchOptions);

  console.log(
    `🧠 Puppeteer browser launched in ${
      Number(process.hrtime.bigint() / 1_000_000n) - t0
    }ms (singleton)`
  );

  return browser;
};
