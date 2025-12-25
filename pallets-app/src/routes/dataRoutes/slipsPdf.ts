import { Router } from "express";
import { prisma } from "../prisma";

// PDF pipeline helpers
import { serializeSlip } from "../pdf/serializeSlip";
import { buildSlipHtml } from "../pdf/buildSlipHtml";
import { renderSlipPdf } from "../pdf/renderSlipPdf";

const router = Router();

/**
 * GET /api/slips/:id/pdf
 *
 * Purpose:
 * - Generate a printable PDF for a single slip
 * - Uses server-side HTML → PDF rendering
 *
 * High-level flow:
 * 1. Validate slip ID
 * 2. Fetch slip + related data from DB
 * 3. Normalize DB data into a print-safe shape
 * 4. Render HTML using a template
 * 5. Convert HTML to PDF
 * 6. Stream PDF back to the client
 */
router.get("/:id/pdf", async (req, res) => {
  // -------------------------
  // 1) Validate route parameter
  // -------------------------
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid slip id" });
  }

  // -------------------------
  // 2) Load slip + relations from DB
  // -------------------------
  // We eagerly load all related entities required for printing
  // so the PDF renderer has everything it needs in one object.
  const slip = await prisma.slip.findUnique({
    where: { id },
    include: {
      client: true,
      ship_to_address: true,
      clerk: true,
      items: {
        include: { pallet_type: true },
      },
    },
  });

  // If the slip does not exist, return 404
  if (!slip) {
    return res.status(404).json({ error: "Slip not found" });
  }

  // -------------------------
  // 3) Normalize data for printing
  // -------------------------
  /**
   * serializeSlip:
   * - Converts Prisma's raw DB model into a stable, print-safe shape
   * - Removes fields we do NOT want in the PDF
   * - Ensures dates are strings, not Date objects
   * - Guarantees predictable structure for HTML templates
   *
   * This prevents:
   * - Template breakage if DB schema changes
   * - Accidental printing of internal fields
   */
  const serializedSlip = serializeSlip(slip);

  // -------------------------
  // 4) Build HTML document
  // -------------------------
  /**
   * buildSlipHtml:
   * - Injects serialized slip data into an HTML template
   * - Produces a full HTML document ready for printing
   */
  const html = buildSlipHtml(serializedSlip);

  // -------------------------
  // 5) Render PDF from HTML
  // -------------------------
  /**
   * renderSlipPdf:
   * - Uses Puppeteer to render HTML in headless Chrome
   * - Applies CSS for layout, spacing, and fonts
   * - Returns a PDF buffer
   */
  const pdf = await renderSlipPdf(html);

  // -------------------------
  // 6) Send PDF response
  // -------------------------
  // Inline allows viewing in-browser
  // Change to "attachment" to force download
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="slip-${serializedSlip.slip_number}.pdf"`
  );

  // Send PDF bytes to client
  res.send(pdf);
});

export default router;
