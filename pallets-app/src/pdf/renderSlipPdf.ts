import puppeteer from "puppeteer";

/**
 * Renders a delivery slip PDF from fully-built HTML.
 *
 * Assumptions:
 * - The HTML already contains all CSS inline (via <style> tag)
 * - All assets (logo, fonts) are embedded as Base64
 * - No external network requests are required
 *
 * @param html Fully composed HTML document
 * @returns PDF file as a Buffer
 */
export const renderSlipPdf = async (html: string): Promise<Buffer> => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: puppeteer.executablePath(), // 🔑 THIS LINE
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });

    const pdfUint8 = await page.pdf({
      format: "letter",
      printBackground: true,
      preferCSSPageSize: true,
    });

    return Buffer.from(pdfUint8);
  } finally {
    await browser.close();
  }
};
