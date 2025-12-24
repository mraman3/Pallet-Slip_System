import puppeteer from "puppeteer";
const now = () => Number(process.hrtime.bigint() / 1_000_000n); // ms

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
  const requestStart = now();
  console.log("📄 PDF render started");

  // Launch a headless Chromium instance
  // --no-sandbox flags are required in many server / Docker environments
    const launchOptions: Parameters<typeof puppeteer.launch>[0] = {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  };

   if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOptions.executablePath =
      process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const t0 = now();
  const browser = await puppeteer.launch(launchOptions);
  console.log(`🧠 Browser launched in ${now() - t0}ms`);

  try {
    const t1 = now();
    // Create a new page (tab)
    const page = await browser.newPage();
    console.log(`📄 Page created in ${now() - t1}ms`);

    const t2 = now();
    // Set the HTML content directly
    // Use domcontentloaded since there are no external assets or JS
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
    });
    console.log(`🧱 HTML rendered in ${now() - t2}ms`);

    const t3 = now();
    // Generate the PDF
    // - format: letter → standard North American paper size
    // - printBackground: true → ensures background colors and borders render
    // - preferCSSPageSize: true → respects @page rules defined in CSS
    const pdfUint8 = await page.pdf({
      format: "letter",
      printBackground: true,
      preferCSSPageSize: true,
    });
    console.log(`🖨️ PDF generated in ${now() - t3}ms`);

    console.log(`✅ PDF render completed in ${now() - requestStart}ms`);

    // Convert Uint8Array to Node Buffer for downstream use
    return Buffer.from(pdfUint8);
  } finally {
    const t4 = now();
    // Always close the browser, even if PDF generation fails
    await browser.close();
    console.log(`🧹 Browser closed in ${now() - t4}ms`);
  }
};
