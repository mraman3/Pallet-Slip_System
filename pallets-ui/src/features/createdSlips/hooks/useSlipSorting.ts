import { useMemo, useState } from "react";

import type { SlipWithRelations } from "../../../types/slipApi";
import type { SortKey } from "../components/SlipResultsTable";

/**
 * Sort direction for table columns
 */
type SortDir = "asc" | "desc";

/**
 * useSlipSorting
 *
 * Responsibilities:
 * - Own sort key + direction state
 * - Expose a click handler for table headers
 * - Return a memoized, sorted version of slip results
 * - Provide a sort indicator helper for UI
 *
 * This hook is intentionally UI-agnostic:
 * - It does not render anything
 * - It does not know about tables or headers
 * - It only works with data + sort intent
 */
export const useSlipSorting = (results: SlipWithRelations[]) => {
  // -------------------------
  // SORT STATE
  // -------------------------
  // Default: sort by slip number descending (newest first)
  const [sortKey, setSortKey] = useState<SortKey>("slip_number");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // -------------------------
  // EVENT HANDLERS
  // -------------------------
  /**
   * Handle a column header click.
   * - Same column → toggle asc/desc
   * - New column → default to ascending
   */
  const handleSort = (key: SortKey) => {
    setSortDir((prev) =>
      key === sortKey ? (prev === "asc" ? "desc" : "asc") : "asc"
    );
    setSortKey(key);
  };

  // -------------------------
  // DERIVED DATA
  // -------------------------
  /**
   * Memoized sorted results.
   * Recomputes only when:
   * - raw results change
   * - sort key changes
   * - sort direction changes
   */
  const sortedResults = useMemo(() => {
    return results.slice().sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      // Extract comparable values based on active sort key
      switch (sortKey) {
        case "slip_number":
          aVal = Number(a.slip_number);
          bVal = Number(b.slip_number);
          break;

        case "date":
          aVal = new Date(a.date).getTime();
          bVal = new Date(b.date).getTime();
          break;

        case "client":
          aVal = a.client?.name ?? "";
          bVal = b.client?.name ?? "";
          break;

        case "ship_to":
          aVal = a.ship_to_address?.location_name ?? "";
          bVal = b.ship_to_address?.location_name ?? "";
          break;

        case "clerk":
          aVal = a.clerk?.name ?? "";
          bVal = b.clerk?.name ?? "";
          break;

        case "shipped_via":
          aVal = a.shipped_via;
          bVal = b.shipped_via;
          break;
      }

      // Apply direction-aware comparison
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [results, sortKey, sortDir]);

  // -------------------------
  // UI HELPERS
  // -------------------------
  /**
   * Returns a visual indicator for the active sort column.
   * Empty string for inactive columns.
   */
  const sortIcon = (key: SortKey) => {
    if (key !== sortKey) return "";
    return sortDir === "asc" ? " ▲" : " ▼";
  };

  // -------------------------
  // PUBLIC API
  // -------------------------
  return {
    sortedResults,
    handleSort,
    sortIcon,
  };
};
