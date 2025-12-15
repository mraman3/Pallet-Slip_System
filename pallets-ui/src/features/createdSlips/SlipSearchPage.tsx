// src/features/createdSlips/SlipSearchPage.tsx
import React, { useEffect, useState } from "react";
import SlipForm from "../slips/SlipForm";
import type { SlipWithRelations } from "../../types/slipApi";
import type { Client } from "../../types/domain";
import type { ClientAddress } from "../../types/domain";
import type { PalletType } from "../../types/domain";
import type { Clerk } from "../../types/domain";

const SlipSearchPage: React.FC = () => {

  type SortKey =
    | "slip_number"
    | "date"
    | "client"
    | "ship_to"
    | "clerk"
    | "shipped_via";

  type SortDir = "asc" | "desc";

  const [sortKey, setSortKey] = useState<SortKey>("slip_number");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // -------------------------
  // FILTER STATE (UI)
  // -------------------------
  const [slipNumber, setSlipNumber] = useState("");
  const [customerOrder, setCustomerOrder] = useState("");
  const [shippedVia, setShippedVia] = useState<"" | "BPI" | "P/U">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [selectedClientId, setSelectedClientId] = useState<number | "">("");
  const [selectedAddressId, setSelectedAddressId] = useState<number | "">("");
  const [selectedPalletTypeId, setSelectedPalletTypeId] = useState<number | "">("");
  const [selectedClerkId, setSelectedClerkId] = useState<number | "">("");

  // -------------------------
  // LOOKUP DATA (API)
  // -------------------------
  const [clientResults, setClientResults] = useState<Client[]>([]);
  const [addressResults, setAddressResults] = useState<ClientAddress[]>([]);
  const [palletTypes, setPalletTypes] = useState<PalletType[]>([]);
  const [clerks, setClerks] = useState<Clerk[]>([]);

  // -------------------------
  // Search filters
  // -------------------------
  const [clientSearch, setClientSearch] = useState("");
  const [addressSearch, setAddressSearch] = useState("");
  const [palletTypeSearch, setPalletTypeSearch] = useState("");

  // -------------------------
  // data
  // -------------------------
  const [results, setResults] = useState<SlipWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------------
  // editing
  // -------------------------
  const [editingSlip, setEditingSlip] = useState<SlipWithRelations | null>(null);

  // -------------------------
  // load (pallet types)
  // -------------------------
  useEffect(() => {
    const fetchPalletTypes = async () => {
      const params = new URLSearchParams();
      params.set("includeInactive", "true");

      const res = await fetch(`/api/pallet-types?${params.toString()}`);
      const data = await res.json();
      setPalletTypes(data);
    };

    fetchPalletTypes();
  }, []);

  // -------------------------
  // load recent slips on mount
  // -------------------------
  useEffect(() => {
    fetchSlips();
  }, []);

  // -------------------------
  // Client search Debounce 
  // -------------------------
  useEffect(() => {
    const controller = new AbortController();

    const fetchClients = async () => {
      try {
        const params = new URLSearchParams();

        if (clientSearch.trim()) {
          params.set("search", clientSearch.trim());
        }

        // 👇 allow inactive clients in dropdown
        params.set("includeInactive", "true");

        const res = await fetch(`/api/clients?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setClientResults(data);
      } catch (e: any) {
        if (e.name === "AbortError") return;
        console.error("Error loading clients", e);
      }
    };

    const t = setTimeout(fetchClients, 300);
    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [clientSearch]);

  // -------------------------
  // Address search Debounce 
  // -------------------------
  useEffect(() => {
    if (!selectedClientId) {
      setAddressResults([]);
      setSelectedAddressId("");
      return;
    }

    const controller = new AbortController();

    const fetchAddresses = async () => {
      try {
        const params = new URLSearchParams();

        if (addressSearch.trim()) {
          params.set("search", addressSearch.trim());
        }

        params.set("includeInactive", "true");

        const res = await fetch(
          `/api/clients/${selectedClientId}/addresses?${params.toString()}`,
          { signal: controller.signal }
        );

        const data = await res.json();
        setAddressResults(data);
      } catch (e: any) {
        if (e.name === "AbortError") return;
        console.error("Error loading addresses", e);
      }
    };

    const t = setTimeout(fetchAddresses, 300);
    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [selectedClientId, addressSearch]);

  // -------------------------
  // Load clerks
  // -------------------------
  useEffect(() => {
    const fetchClerks = async () => {
      try {
        const params = new URLSearchParams();
        params.set("includeInactive", "true");

        const res = await fetch(`/api/clerks?${params.toString()}`);
        const data = await res.json();
        setClerks(data);
      } catch (e) {
        console.error("Error loading clerks", e);
      }
    };

    fetchClerks();
  }, []);

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
      if (selectedPalletTypeId) {
        params.set("pallet_type_id", String(selectedPalletTypeId));
      }
      if (selectedClientId) {
        params.set("client_id", String(selectedClientId));
      }
      if (selectedAddressId) {
        params.set("ship_to_address_id", String(selectedAddressId));
      }
      if (selectedClerkId) {
        params.set("clerk_id", String(selectedClerkId));
      }

      const res = await fetch(`/api/slips?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load slips");
      }

      setResults(data);
    } catch (e: any) {
      console.error("Error loading slips", e);
      setError(e.message || "Unexpected error loading slips");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // load slip for editing
  // -------------------------
  const handleEdit = async (id: number) => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // after save (edit)
  // -------------------------
  const handleSaved = () => {
    setEditingSlip(null);
    fetchSlips();
  };

  // -------------------------
  // render edit mode
  // -------------------------
  if (editingSlip) {
    return (
      <div>
        <h2>Edit Slip #{editingSlip.slip_number}</h2>

        <SlipForm
          mode="edit"
          initialSlip={editingSlip}
          onSaved={handleSaved}
        />

        <button
          type="button"
          style={{ marginTop: 12 }}
          onClick={() => setEditingSlip(null)}
        >
          Back to Search
        </button>
      </div>
    );
  }

  // -------------------------
  // Table sorting 
  // -------------------------
  const handleSort = (key: SortKey) => {
    setSortDir((prev) =>
      key === sortKey ? (prev === "asc" ? "desc" : "asc") : "asc"
    );
    setSortKey(key);
  };

  const sortedResults = results.slice().sort((a, b) => {
    let aVal: string | number = "";
    let bVal: string | number = "";

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

    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const sortIcon = (key: SortKey) => {
    if (key !== sortKey) return "";
    return sortDir === "asc" ? " ▲" : " ▼";
  };

  // -------------------------
  // render search page
  // -------------------------
  return (
    <div style={{ maxWidth: 1100 }}>
      <h2>Find / Recent Slips</h2>

      {/* Filters */}
      <fieldset style={{ marginBottom: 16 }}>
        <legend>Search Filters</legend>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {/**Slip Number filter*/}
          <label>
            Slip #<br />
            <input value={slipNumber} onChange={(e) => setSlipNumber(e.target.value)} />
          </label>

          {/**Customer Order filter*/}
          <label>
            Customer Order<br />
            <input
              value={customerOrder}
              onChange={(e) => setCustomerOrder(e.target.value)}
            />
          </label>

          {/**Client Search */}
          <label>
            Client<br />
            <input
              placeholder="Search client..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
            />
          </label>
          {/**Client dropdown */}
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
                .sort((a, b) => {
                  // active first
                  if (a.active !== b.active) return a.active ? -1 : 1;
                  return a.name.localeCompare(b.name);
                })
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {!c.active ? " (inactive)" : ""}
                  </option>
                ))}
            </select>

          </label>

          {/**Address Search */}
          <label>
            Ship To Search<br />
            <input
              placeholder="Search address..."
              value={addressSearch}
              onChange={(e) => setAddressSearch(e.target.value)}
            />
          </label>
          {/**Address dropdown */}
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
                .sort((a, b) => {
                  // active first
                  if (a.active !== b.active) return a.active ? -1 : 1;
                  // alphabetical by location/city
                  return (a.location_name || "").localeCompare(b.location_name || "");
                })
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.location_name} — {a.city}
                    {!a.active ? " (inactive)" : ""}
                  </option>
                ))}
            </select>
          </label>

          {/**Pallet search */}
          <label>
            Pallet Type Search<br />
            <input
              value={palletTypeSearch}
              onChange={(e) => setPalletTypeSearch(e.target.value)}
              placeholder="Type pallet type..."
            />
          </label>

          {/** Pallet type dropdown */}
          <label>
            Pallet Type<br />
            <select
              value={selectedPalletTypeId}
              onChange={(e) =>
                setSelectedPalletTypeId(
                  e.target.value ? Number(e.target.value) : ""
                )
              }
            >
              <option value="">-- Any --</option>

              {palletTypes
                .slice()
                .filter((p) => {
                  const q = palletTypeSearch.trim().toLowerCase();
                  if (!q) return true; // empty search => show all
                  return p.name.toLowerCase().includes(q);
                })
                .sort((a, b) => {
                  // active first
                  if (a.active !== b.active) return a.active ? -1 : 1;
                  // alphabetical
                  return a.name.localeCompare(b.name);
                })
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {!p.active ? " (inactive)" : ""}
                  </option>
                ))}
            </select>
          </label>

          {/**Shipped Via dropdown */}
          <label>
            Shipped Via<br />
            <select value={shippedVia} onChange={(e) => setShippedVia(e.target.value as any)}>
              <option value="">-- Any --</option>
              <option value="BPI">BPI</option>
              <option value="P/U">P/U</option>
            </select>
          </label>

          {/**Clerk dropdown */}
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
                .sort((a, b) => {
                  // active first
                  if (a.active !== b.active) return a.active ? -1 : 1;
                  return a.name.localeCompare(b.name);
                })
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {!c.active ? " (inactive)" : ""}
                  </option>
                ))}
            </select>
          </label>

          {/**Date from range filter */}
          <label>
            From Date<br />
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </label>

          {/**Date to range filter */}
          <label>
            To Date<br />
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </label>

          <button type="button" onClick={fetchSlips} style={{ alignSelf: "flex-end" }}>
            Search
          </button>
        </div>
      </fieldset>

      {/* Results */}
      {loading && <p>Loading slips...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && results.length === 0 && <p>No slips found.</p>}

      {results.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{textAlign: "left"}}>
            <tr>
              <th onClick={() => handleSort("slip_number")} style={{ cursor: "pointer" }}>
                Slip #{sortIcon("slip_number")}
              </th>

              <th onClick={() => handleSort("date")} style={{ cursor: "pointer" }}>
                Date{sortIcon("date")}
              </th>

              <th onClick={() => handleSort("client")} style={{ cursor: "pointer" }}>
                Client{sortIcon("client")}
              </th>

              <th onClick={() => handleSort("ship_to")} style={{ cursor: "pointer" }}>
                Ship To{sortIcon("ship_to")}
              </th>

              <th onClick={() => handleSort("clerk")} style={{ cursor: "pointer" }}>
                Clerk{sortIcon("clerk")}
              </th>

              <th onClick={() => handleSort("shipped_via")} style={{ cursor: "pointer" }}>
                Via{sortIcon("shipped_via")}
              </th>

              <th />
            </tr>
          </thead>
          <tbody>
            {sortedResults.map((s) => (
              <tr key={s.id}>
                <td>{s.slip_number}</td>
                <td>{s.date.slice(0, 10)}</td>
                <td>{s.client.name}</td>
                <td>{s.ship_to_address.location_name}</td>
                <td>{s.clerk.name}</td>
                <td>{s.shipped_via}</td>
                <td style={{ textAlign: "right" }}>
                  <button type="button" onClick={() => handleEdit(s.id)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SlipSearchPage;
