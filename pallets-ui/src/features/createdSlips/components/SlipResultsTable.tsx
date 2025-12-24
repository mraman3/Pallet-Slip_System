import React from "react";
import type { SlipWithRelations } from "../../../types/slipApi";

//import api
import { API_BASE } from "../../../config/api";

/**
 * SortKey
 *
 * Defines all sortable columns in the slips table.
 * Shared with the sorting hook to keep types aligned.
 */
export type SortKey =
  | "slip_number"
  | "date"
  | "client"
  | "ship_to"
  | "clerk"
  | "shipped_via";

/**
 * Props for SlipResultsTable
 *
 * This component is intentionally presentational:
 * - Receives already-sorted slips
 * - Emits sort intent (column clicks)
 * - Emits edit intent
 * - Does NOT manage state or side effects
 */
interface Props {
  slips: SlipWithRelations[];
  onEdit: (id: number) => void;

  // Sorting controls (owned by parent via hook)
  onSort: (key: SortKey) => void;
  sortIcon: (key: SortKey) => string;
}

/**
 * SlipResultsTable
 *
 * Responsibilities:
 * - Render a table of slips
 * - Allow column-based sorting via clickable headers
 * - Provide an Edit action per row
 *
 * Non-responsibilities:
 * - Fetching data
 * - Sorting logic
 * - Pagination
 * - Edit navigation
 */
const SlipResultsTable: React.FC<Props> = ({
  slips,
  onEdit,
  onSort,
  sortIcon,
}) => {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      {/* Table header: sortable columns */}
      <thead style={{ textAlign: "left" }}>
        <tr>
          <th onClick={() => onSort("slip_number")} style={{ cursor: "pointer" }}>
            Slip #{sortIcon("slip_number")}
          </th>

          <th onClick={() => onSort("date")} style={{ cursor: "pointer" }}>
            Date{sortIcon("date")}
          </th>

          <th onClick={() => onSort("client")} style={{ cursor: "pointer" }}>
            Client{sortIcon("client")}
          </th>

          <th onClick={() => onSort("ship_to")} style={{ cursor: "pointer" }}>
            Ship To{sortIcon("ship_to")}
          </th>

          <th onClick={() => onSort("clerk")} style={{ cursor: "pointer" }}>
            Clerk{sortIcon("clerk")}
          </th>

          <th onClick={() => onSort("shipped_via")} style={{ cursor: "pointer" }}>
            Via{sortIcon("shipped_via")}
          </th>

          {/* Actions column (not sortable) */}
          <th />
        </tr>
      </thead>

      {/* Table body: slip rows */}
      <tbody>
        {slips.map((s) => (
          <tr key={s.id}>
            <td>{s.slip_number}</td>

            {/* ISO date trimmed to YYYY-MM-DD */}
            <td>{s.date.slice(0, 10)}</td>

            <td>{s.client.name}</td>
            <td>{s.ship_to_address.location_name}</td>
            <td>{s.clerk.name}</td>
            <td>{s.shipped_via}</td>

            {/* Row-level actions */}
            <td style={{ textAlign: "right" }}>
              <button type="button" onClick={() => onEdit(s.id)}>
                Edit
              </button>

              <button
                type="button"
                onClick={() =>
                  window.open(`${API_BASE}/slips/${s.id}/pdf`, "_blank", "noopener,noreferrer")
                }
              >
                Print
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default SlipResultsTable;
