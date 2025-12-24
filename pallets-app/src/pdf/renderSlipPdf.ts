// src/pdf/renderSlipPdf.ts
import { getBrowser } from "./getBrowser";

// High-resolution timing helper (ms)
const now = () => Number(process.hrtime.bigint() / 1_000_000n);

/**
 * Renders a delivery slip PDF from fully-built HTML.
 *
 * Assumptions:
 * - HTML already contains all CSS inline (<style>)
 * - All assets (logo, fonts) are Base64 embedded
 * - No external network requests are required
 *
 * Performance:
 * - Shared Chromium instance
 * - One page per request
 */
export const renderSlipPdf = async (html: string): Promise<Buffer> => {
  const requestStart = now();
  console.log("📄 PDF render started");

  // --------------------------------------------------
  // Browser acquisition (cold start vs warm reuse)
  // --------------------------------------------------
  const t0 = now();
  const browser = await getBrowser();
  console.log(`🧠 Browser ready in ${now() - t0}ms`);

  // --------------------------------------------------
  // Page lifecycle
  // --------------------------------------------------
  const t1 = now();
  const page = await browser.newPage();
  console.log(`📄 Page created in ${now() - t1}ms`);

  try {
    // ----------------------------------------------
    // HTML render
    // ----------------------------------------------
    const t2 = now();
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
    });
    console.log(`🧱 HTML rendered in ${now() - t2}ms`);

    // ----------------------------------------------
    // PDF generation
    // ----------------------------------------------
    const t3 = now();
    const pdfUint8 = await page.pdf({
      format: "letter",
      printBackground: true,
      preferCSSPageSize: true,
    });
    console.log(`🖨️ PDF generated in ${now() - t3}ms`);

    console.log(`✅ PDF render completed in ${now() - requestStart}ms`);

    return Buffer.from(pdfUint8);
  } finally {
    // Always close the page — browser stays alive
    await page.close();
  }
};
