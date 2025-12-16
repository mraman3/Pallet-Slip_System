// src/features/createdSlips/SlipSearchPage.tsx
import React, { useEffect, useState } from "react";

// UI components
import SlipFilters from "./components/SlipFilters";
import SlipResultsTable from "./components/SlipResultsTable";
import EditSlipView from "./components/EditSlipView";
import SlipPagination from "./components/SlipPagination";


// Domain-specific hooks
import { useSlipSorting } from "./hooks/useSlipSorting";
import { useClientLookup } from "./hooks/useClientLookup";
import { usePalletTypes } from "./hooks/usePalletTypes";
import { useClerks } from "./hooks/useClerks";

// Types
import type { SlipWithRelations } from "../../types/slipApi";

const PAGE_SIZE = 25;

/**
 * SlipSearchPage
 *
 * High-level responsibilities:
 * - Own all filter state
 * - Fetch slips based on filters
 * - Coordinate search vs edit mode
 * - Wire data into presentational components
 */
const SlipSearchPage: React.FC = () => {
  // -------------------------
  // FILTER STATE (UI)
  // -------------------------
  // Simple input filters
  const [slipNumber, setSlipNumber] = useState("");
  const [customerOrder, setCustomerOrder] = useState("");
  const [shippedVia, setShippedVia] = useState<"" | "BPI" | "P/U">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Entity selectors
  const [selectedClientId, setSelectedClientId] = useState<number | "">("");
  const [selectedAddressId, setSelectedAddressId] = useState<number | "">("");
  const [selectedPalletTypeId, setSelectedPalletTypeId] = useState<number | "">("");
  const [selectedClerkId, setSelectedClerkId] = useState<number | "">("");

  // Search inputs for dropdown filtering
  const [clientSearch, setClientSearch] = useState("");
  const [addressSearch, setAddressSearch] = useState("");
  const [palletTypeSearch, setPalletTypeSearch] = useState("");

  // -------------------------
  // SEARCH RESULTS STATE
  // -------------------------
  // Results returned from /api/slips
  const [results, setResults] = useState<SlipWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------------
  // PAGINATION STATE
  // -------------------------
  // Current page (1-based for UI clarity)
  const [page, setPage] = useState(1);

  // Total matching slips in DB (returned by backend)
  const [total, setTotal] = useState(0);

  // Derived pagination values
  const offset = (page - 1) * PAGE_SIZE;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // -------------------------
  // EDIT STATE
  // -------------------------
  // When set, page switches from search → edit mode
  const [editingSlip, setEditingSlip] = useState<SlipWithRelations | null>(null);

  // -------------------------
  // DERIVED DATA (CUSTOM HOOKS)
  // -------------------------
  // Static lookup data
  const { palletTypes } = usePalletTypes();
  const { clerks } = useClerks();

  // Client + address lookup with debounce
  const { clientResults, addressResults } = useClientLookup({
    clientSearch,
    addressSearch,
    selectedClientId,
  });

  // Sorted view of search results (table headers control sort)
  const { sortedResults, handleSort, sortIcon } = useSlipSorting(results);

  // -------------------------
  // SIDE EFFECTS
  // -------------------------

  // Initial page load → fetch recent slips
  useEffect(() => {
    fetchSlips();
  }, [page]);

  useEffect(() => {
    setPage(1);
  }, [
    slipNumber,
    customerOrder,
    shippedVia,
    fromDate,
    toDate,
    selectedClientId,
    selectedAddressId,
    selectedPalletTypeId,
    selectedClerkId,
  ]);


  // When client changes, clear any previously selected address
  // (prevents stale ship_to_address_id from leaking into API query)
  useEffect(() => {
    setSelectedAddressId("");
  }, [selectedClientId]);

  // -------------------------
  // ACTIONS / HANDLERS
  // -------------------------

  /**
   * Fetch slips based on current filter state.
   * Builds query params dynamically to avoid sending empty filters.
   */
  const fetchSlips = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();

      if (slipNumber.trim()) params.set("slip_number", slipNumber.trim());
      if (customerOrder.trim()) params.set("customer_order", customerOrder.trim());
      if (shippedVia) params.set("shipped_via", shippedVia);
      if (fromDate) params.set("from_date", fromDate);
      if (toDate) params.set("to_date", toDate);
      if (selectedPalletTypeId) params.set("pallet_type_id", String(selectedPalletTypeId));
      if (selectedClientId) params.set("client_id", String(selectedClientId));
      if (selectedAddressId) params.set("ship_to_address_id", String(selectedAddressId));
      if (selectedClerkId) params.set("clerk_id", String(selectedClerkId));
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(offset));

      const res = await fetch(`/api/slips?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load slips");
      }

      setResults(data.data);
      setTotal(data.total);
    } catch (e: any) {
      console.error("Error loading slips", e);
      setError(e.message || "Unexpected error loading slips");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load a single slip and enter edit mode.
   * Note: does NOT use global loading state (separate screen).
   */
  const handleEdit = async (id: number) => {
    try {
      setError(null);

      const res = await fetch(`/api/slips/${id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load slip");
      }

      setEditingSlip(data);
    } catch (e: any) {
      console.error("Error loading slip", e);
      setError(e.message || "Unexpected error loading slip");
    }
  };

  /**
   * After saving an edit:
   * - return to search mode
   * - refresh slip list
   */
  const handleSaved = () => {
    setEditingSlip(null);
    fetchSlips();
  };

  // -------------------------
  // RENDER: EDIT MODE
  // -------------------------
  if (editingSlip) {
    return (
      <EditSlipView
        slip={editingSlip}
        onBack={() => setEditingSlip(null)}
        onSaved={handleSaved}
      />
    );
  }

  // -------------------------
  // RENDER: SEARCH MODE
  // -------------------------
  return (
    <div style={{ maxWidth: 1100 }}>
      <h2>Find / Recent Slips</h2>

      {/* Filter controls */}
      <SlipFilters
        slipNumber={slipNumber}
        customerOrder={customerOrder}
        shippedVia={shippedVia}
        fromDate={fromDate}
        toDate={toDate}

        selectedClientId={selectedClientId}
        selectedAddressId={selectedAddressId}
        selectedPalletTypeId={selectedPalletTypeId}
        selectedClerkId={selectedClerkId}

        clientSearch={clientSearch}
        addressSearch={addressSearch}
        palletTypeSearch={palletTypeSearch}

        setSlipNumber={setSlipNumber}
        setCustomerOrder={setCustomerOrder}
        setShippedVia={setShippedVia}
        setFromDate={setFromDate}
        setToDate={setToDate}

        setSelectedClientId={setSelectedClientId}
        setSelectedAddressId={setSelectedAddressId}
        setSelectedPalletTypeId={setSelectedPalletTypeId}
        setSelectedClerkId={setSelectedClerkId}

        setClientSearch={setClientSearch}
        setAddressSearch={setAddressSearch}
        setPalletTypeSearch={setPalletTypeSearch}

        clientResults={clientResults}
        addressResults={addressResults}
        palletTypes={palletTypes}
        clerks={clerks}

        onSearch={fetchSlips}
        loading={loading}
      />

      {/* Results / status */}
      {loading && <p>Loading slips...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && results.length === 0 && <p>No slips found.</p>}

      {results.length > 0 && (
        <>
          <SlipResultsTable
            slips={sortedResults}
            onEdit={handleEdit}
            onSort={handleSort}
            sortIcon={sortIcon}
          />

          <SlipPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
};

export default SlipSearchPage;
