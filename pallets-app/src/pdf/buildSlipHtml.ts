import fs from "fs";
import path from "path";

const resolveFile = (...parts: string[]) => {
  const candidates = [
    path.join(__dirname, ...parts),                   // dist/pdf/*
    path.join(process.cwd(), "src", "pdf", ...parts), // src/pdf/*
    path.join(process.cwd(), "dist", "pdf", ...parts) // dist/pdf/*
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }

  throw new Error("PDF Asset Not Found: " + parts.join("/"));
};

export const buildSlipHtml = (slip: any): string => {

  // 1. Load HTML & CSS templates
  let html = fs.readFileSync(
    resolveFile("templates", "slip.html"),
    "utf-8"
  );

  let css = fs.readFileSync(
    resolveFile("templates", "slip.css"),
    "utf-8"
  );

  // 2. Load assets (logo + font)
  const logoBase64 = fs.readFileSync(
    resolveFile("assets", "brampton-pallet-logo.webp"),
    "base64"
  );

  const courierStdBase64 = fs.readFileSync(
    resolveFile("assets", "fonts", "CourierStd-Bold.otf"),
    "base64"
  );

  // 3. Inject font into CSS
  css = css.replace(
    "__COURIER_STD_FONT__",
    `data:font/opentype;base64,${courierStdBase64}`
  );

  // 4. Inject CSS into HTML
  html = html.replace("<!-- STYLE_BLOCK -->", `<style>${css}</style>`);

  // 5. Build item rows
  const MIN_ROWS = 1;

  const realRows = slip.items.map((i: any) => `
  <tr>
    <td class="col-20">${i.qty_ordered ?? ""}</td>
    <td class="col-20">${i.qty_shipped ?? ""}</td>
    <td class="col-60" colspan="3" style="text-align:left;">
      ${i.pallet_type?.name ?? ""}
    </td>
  </tr>
`);

  const emptyRow = `
  <tr>
    <td class="col-20">&nbsp;</td>
    <td class="col-20">&nbsp;</td>
    <td class="col-60" colspan="3">&nbsp;</td>
  </tr>
`;

  const itemRows =
    realRows.join("") +
    Array(Math.max(0, MIN_ROWS - realRows.length))
      .fill(emptyRow)
      .join("");

  // 6. Replace placeholders
  html = html
    .replace("__LOGO_BASE64__", `data:image/webp;base64,${logoBase64}`)
    .replace("__SLIP_NUMBER__", slip.slip_number)
    .replace("__DATE__", slip.date?.slice(0, 10) ?? "")
    .replace("__CLERK__", slip.clerk?.name ?? "")
    .replace("__CUSTOMER_ORDER__", slip.customer_order ?? "")
    .replace("__DATE_SHIPPED__", slip.date_shipped?.slice(0, 10) ?? "")
    .replace("__SHIPPED_VIA__", slip.shipped_via ?? "")
    .replace("__CLIENT_NAME__", slip.client?.name ?? "")
    .replace("__CLIENT_ADDRESS__", slip.client?.address ?? "")
    .replace(
      "__CLIENT_CITY__",
      `${slip.client?.city ?? ""}, ${slip.client?.province ?? ""} ${slip.client?.postal ?? ""}`
    )
    .replace("__SHIP_NAME__", slip.ship_to_address?.location_name ?? "")
    .replace("__SHIP_ADDRESS__", slip.ship_to_address?.address ?? "")
    .replace(
      "__SHIP_CITY__",
      `${slip.ship_to_address?.city ?? ""}, ${slip.ship_to_address?.province ?? ""} ${slip.ship_to_address?.postal ?? ""}`
    )
    .replace("__COMMENTS_1__", slip.comments_line1 ?? "")
    .replace("__COMMENTS_2__", slip.comments_line2 ?? "")
    .replace("__ITEM_ROWS__", itemRows);

  return html;
};
