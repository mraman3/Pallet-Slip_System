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
  // Launch a headless Chromium instance
  // --no-sandbox flags are required in many server / Docker environments
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    // Create a new page (tab)
    const page = await browser.newPage();

    // Set the HTML content directly
    // Use domcontentloaded since there are no external assets or JS
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
    });

    // Generate the PDF
    // - format: letter → standard North American paper size
    // - printBackground: true → ensures background colors and borders render
    // - preferCSSPageSize: true → respects @page rules defined in CSS
    const pdfUint8 = await page.pdf({
      format: "letter",
      printBackground: true,
      preferCSSPageSize: true,
    });

    // Convert Uint8Array to Node Buffer for downstream use
    return Buffer.from(pdfUint8);
  } finally {
    // Always close the browser, even if PDF generation fails
    await browser.close();
  }
};
