import React from "react";
import "./css/SlipResultsTable.css"

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
    <div className="slip-search-table-wrapper">
      <table className="slip-search-table">
        <thead>
          <tr>
            <th
              className="sortable"
              onClick={() => onSort("slip_number")}
            >
              Slip #{sortIcon("slip_number")}
            </th>

            <th
              className="sortable"
              onClick={() => onSort("date")}
            >
              Date{sortIcon("date")}
            </th>

            <th
              className="sortable"
              onClick={() => onSort("client")}
            >
              Client{sortIcon("client")}
            </th>

            <th
              className="sortable"
              onClick={() => onSort("ship_to")}
            >
              Ship To{sortIcon("ship_to")}
            </th>

            <th
              className="sortable"
              onClick={() => onSort("clerk")}
            >
              Clerk{sortIcon("clerk")}
            </th>

            <th
              className="sortable"
              onClick={() => onSort("shipped_via")}
            >
              Via{sortIcon("shipped_via")}
            </th>

            {/* Actions column */}
            <th className="actions" />
          </tr>
        </thead>

        <tbody>
          {slips.map((s) => (
            <tr key={s.id}>
              <td>{s.slip_number}</td>
              <td>{s.date.slice(0, 10)}</td>
              <td>{s.client.name}</td>
              <td>{s.ship_to_address.location_name}</td>
              <td>{s.clerk.name}</td>
              <td>{s.shipped_via}</td>

              <td className="actions">
                <button
                  type="button"
                  onClick={() => onEdit(s.id)}
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      `${API_BASE}/slips/${s.id}/pdf`,
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
                >
                  Print
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SlipResultsTable;
