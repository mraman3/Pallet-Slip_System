import React from "react";
import type { Client } from "../../../types/domain";
import type { ClientAddress } from "../../../types/domain";
import type { PalletType } from "../../../types/domain";
import type { Clerk } from "../../../types/domain";

/**
 * Props for SlipFilters
 *
 * This component is intentionally presentational:
 * - It renders filter inputs only
 * - All state is owned by the parent page
 * - It emits user intent via setters and callbacks
 */
interface Props {
  // -------------------------
  // CURRENT FILTER VALUES
  // -------------------------
  slipNumber: string;
  customerOrder: string;
  shippedVia: "" | "BPI" | "P/U";
  fromDate: string;
  toDate: string;

  selectedClientId: number | "";
  selectedAddressId: number | "";
  selectedPalletTypeId: number | "";
  selectedClerkId: number | "";

  clientSearch: string;
  addressSearch: string;
  palletTypeSearch: string;

  // -------------------------
  // SETTERS (OWNED BY PARENT)
  // -------------------------
  setSlipNumber: (v: string) => void;
  setCustomerOrder: (v: string) => void;
  setShippedVia: (v: "" | "BPI" | "P/U") => void;
  setFromDate: (v: string) => void;
  setToDate: (v: string) => void;

  setSelectedClientId: (v: number | "") => void;
  setSelectedAddressId: (v: number | "") => void;
  setSelectedPalletTypeId: (v: number | "") => void;
  setSelectedClerkId: (v: number | "") => void;

  setClientSearch: (v: string) => void;
  setAddressSearch: (v: string) => void;
  setPalletTypeSearch: (v: string) => void;

  // -------------------------
  // LOOKUP DATA
  // -------------------------
  clientResults: Client[];
  addressResults: ClientAddress[];
  palletTypes: PalletType[];
  clerks: Clerk[];

  // -------------------------
  // ACTIONS
  // -------------------------
  onSearch: () => void;
  loading: boolean;
}

/**
 * SlipFilters
 *
 * Responsibilities:
 * - Render all search/filter controls
 * - Display lookup dropdowns (clients, addresses, pallet types, clerks)
 * - Disable search button while searching
 *
 * Non-responsibilities:
 * - Fetching data
 * - Managing state
 * - Building query params
 */
const SlipFilters: React.FC<Props> = ({
  // current values
  slipNumber,
  customerOrder,
  shippedVia,
  fromDate,
  toDate,

  selectedClientId,
  selectedAddressId,
  selectedPalletTypeId,
  selectedClerkId,

  clientSearch,
  addressSearch,
  palletTypeSearch,

  // setters
  setSlipNumber,
  setCustomerOrder,
  setShippedVia,
  setFromDate,
  setToDate,

  setSelectedClientId,
  setSelectedAddressId,
  setSelectedPalletTypeId,
  setSelectedClerkId,

  setClientSearch,
  setAddressSearch,
  setPalletTypeSearch,

  // lookup data
  clientResults,
  addressResults,
  palletTypes,
  clerks,

  // actions
  onSearch,
  loading,
}) => {
  return (
    <fieldset style={{ marginBottom: 16 }}>
      <legend>Search Filters</legend>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {/* Slip number filter */}
        <label>
          Slip #<br />
          <input
            value={slipNumber}
            onChange={(e) => setSlipNumber(e.target.value)}
          />
        </label>

        {/* Customer order filter */}
        <label>
          Customer Order<br />
          <input
            value={customerOrder}
            onChange={(e) => setCustomerOrder(e.target.value)}
          />
        </label>

        {/* Client search input */}
        <label>
          Client<br />
          <input
            placeholder="Search client..."
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
          />
        </label>

        {/* Client selector */}
        <label>
          Select Client<br />
          <select
            value={selectedClientId}
            onChange={(e) =>
              setSelectedClientId(e.target.value ? Number(e.target.value) : "")
            }
          >
            <option value="">-- Any --</option>
            {clientResults
              .slice()
              .sort((a, b) =>
                a.active !== b.active
                  ? a.active ? -1 : 1
                  : a.name.localeCompare(b.name)
              )
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {!c.active ? " (inactive)" : ""}
                </option>
              ))}
          </select>
        </label>

        {/* Address search input */}
        <label>
          Ship To Search<br />
          <input
            placeholder="Search address..."
            value={addressSearch}
            onChange={(e) => setAddressSearch(e.target.value)}
          />
        </label>

        {/* Address selector */}
        <label>
          Select Ship To<br />
          <select
            value={selectedAddressId}
            onChange={(e) =>
              setSelectedAddressId(e.target.value ? Number(e.target.value) : "")
            }
          >
            <option value="">-- Any --</option>
            {addressResults
              .slice()
              .sort((a, b) =>
                a.active !== b.active
                  ? a.active ? -1 : 1
                  : (a.location_name || "").localeCompare(b.location_name || "")
              )
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.location_name} — {a.city}
                  {!a.active ? " (inactive)" : ""}
                </option>
              ))}
          </select>
        </label>

        {/* Pallet type search input */}
        <label>
          Pallet Type Search<br />
          <input
            value={palletTypeSearch}
            onChange={(e) => setPalletTypeSearch(e.target.value)}
          />
        </label>

        {/* Pallet type selector */}
        <label>
          Pallet Type<br />
          <select
            value={selectedPalletTypeId}
            onChange={(e) =>
              setSelectedPalletTypeId(e.target.value ? Number(e.target.value) : "")
            }
          >
            <option value="">-- Any --</option>
            {palletTypes
              .slice()
              .filter((p) =>
                palletTypeSearch
                  ? p.name.toLowerCase().includes(palletTypeSearch.toLowerCase())
                  : true
              )
              .sort((a, b) =>
                a.active !== b.active
                  ? a.active ? -1 : 1
                  : a.name.localeCompare(b.name)
              )
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {!p.active ? " (inactive)" : ""}
                </option>
              ))}
          </select>
        </label>

        {/* Shipped via selector */}
        <label>
          Shipped Via<br />
          <select
            value={shippedVia}
            onChange={(e) => setShippedVia(e.target.value as any)}
          >
            <option value="">-- Any --</option>
            <option value="BPI">BPI</option>
            <option value="P/U">P/U</option>
          </select>
        </label>

        {/* Clerk selector */}
        <label>
          Clerk<br />
          <select
            value={selectedClerkId}
            onChange={(e) =>
              setSelectedClerkId(e.target.value ? Number(e.target.value) : "")
            }
          >
            <option value="">-- Any --</option>
            {clerks
              .slice()
              .sort((a, b) =>
                a.active !== b.active
                  ? a.active ? -1 : 1
                  : a.name.localeCompare(b.name)
              )
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {!c.active ? " (inactive)" : ""}
                </option>
              ))}
          </select>
        </label>

        {/* Date range */}
        <label>
          From Date<br />
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </label>

        <label>
          To Date<br />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </label>

        {/* Search action */}
        <button
          type="button"
          onClick={onSearch}
          disabled={loading}
          style={{ alignSelf: "flex-end" }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>
    </fieldset>
  );
};

export default SlipFilters;
