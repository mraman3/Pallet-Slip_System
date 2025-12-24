import React, { useEffect, useState } from "react";

//import api
import { API_BASE } from "../../../config/api";
import { apiFetch } from "../../../config/apiFetch";

import type { Client, ClientAddress } from "../../../types/domain";

const emptyAddressForm = {
  location_name: "",
  address: "",
  city: "",
  province: "",
  postal: "",
};

type Props = {
  clientVersion: number;
};

const AddressAdminSection: React.FC<Props> = ({ clientVersion }) => {
  const [activeTab, setActiveTab] = useState<"add" | "edit">("add");

  // --- client selection (required) ---
  const [clientSearch, setClientSearch] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | "">("");
  const [showInactiveClients, setShowInactiveClients] = useState(false);

  // --- addresses list (single source of truth) ---
  const [addressSearch, setAddressSearch] = useState("");
  const [addresses, setAddresses] = useState<ClientAddress[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // --- add ---
  const [addForm, setAddForm] = useState(emptyAddressForm);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addMessage, setAddMessage] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  // --- edit ---
  const [selectedAddressId, setSelectedAddressId] = useState<number | "">("");
  const [editForm, setEditForm] = useState(emptyAddressForm);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editMessage, setEditMessage] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // -------------------------
  // CLIENT SEARCH (dropdown)
  // -------------------------
  const fetchClients = async (searchValue: string, includeInactive: boolean, signal?: AbortSignal) => {
    try {
      const params = new URLSearchParams();
      if (searchValue.trim()) params.set("search", searchValue.trim());
      if (includeInactive) params.set("includeInactive", "true");

      const res = await apiFetch(`${API_BASE}/clients?${params.toString()}`, { signal });
      const data: Client[] = await res.json();
      setClients(data);
    } catch (e) {
      if ((e as any).name === "AbortError") return;
      console.error("Error fetching clients", e);
    }
  };

  // initial client load
  useEffect(() => {
    const controller = new AbortController();
    fetchClients("", showInactiveClients, controller.signal);
    return () => controller.abort();
  }, [clientVersion]);

  // debounce client search
  useEffect(() => {
    const controller = new AbortController();
    const t = setTimeout(() => {
      fetchClients(clientSearch, showInactiveClients, controller.signal);
    }, 300);
    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [clientSearch, showInactiveClients]);

  // -------------------------
  // ADDRESS LIST (by client)
  // -------------------------
  const fetchAddresses = async (
    clientId: number,
    searchValue: string,
    includeInactive: boolean,
    signal?: AbortSignal
  ) => {
    try {
      setLoadingAddresses(true);

      const params = new URLSearchParams();
      if (searchValue.trim()) params.set("search", searchValue.trim());
      if (includeInactive) params.set("includeInactive", "true");

      const res = await apiFetch(
        `${API_BASE}/clients/${clientId}/addresses?${params.toString()}`,
        { signal }
      );

      const data: ClientAddress[] = await res.json();
      setAddresses(data);
    } catch (e) {
      if ((e as any).name === "AbortError") return;
      console.error("Error fetching addresses", e);
    } finally {
      setLoadingAddresses(false);
    }
  };

  // whenever client changes: reset address state + load addresses
  useEffect(() => {
    setAddresses([]);
    setAddressSearch("");
    setSelectedAddressId("");
    setEditForm(emptyAddressForm);

    if (!selectedClientId) return;

    const controller = new AbortController();
    fetchAddresses(Number(selectedClientId), "", showInactive, controller.signal);
    return () => controller.abort();
  }, [selectedClientId]);

  // debounce address search + showInactive
  useEffect(() => {
    if (!selectedClientId) return;
    const controller = new AbortController();

    const t = setTimeout(() => {
      fetchAddresses(
        Number(selectedClientId),
        addressSearch,
        showInactive,
        controller.signal
      );
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [addressSearch, showInactive, selectedClientId]);

  // -------------------------
  // ADD handlers
  // -------------------------
  const handleAddChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddForm((p) => ({ ...p, [name]: value }));
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddSubmitting(true);
    setAddMessage(null);
    setAddError(null);

    try {
      if (!selectedClientId) {
        setAddError("Please select a client first.");
        setAddSubmitting(false);
        return;
      }

      const { location_name, address, city, province, postal } = addForm;

      if (!location_name || !address || !city || !province || !postal) {
        setAddError("All fields are required.");
        setAddSubmitting(false);
        return;
      }

      const res = await apiFetch(`${API_BASE}/clients/${selectedClientId}/addresses`, {
        method: "POST",
        body: JSON.stringify({
          location_name,
          address,
          city,
          province,
          postal,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAddError(data.error || "Failed to create address.");
      } else {
        setAddMessage(`Address "${data.location_name}" created.`);
        setAddForm(emptyAddressForm);

        await fetchAddresses(Number(selectedClientId), addressSearch, showInactive);
      }
    } catch (e) {
      console.error("Error creating address", e);
      setAddError("Unexpected error creating address.");
    } finally {
      setAddSubmitting(false);
    }
  };

  // -------------------------
  // EDIT: populate form
  // -------------------------
  useEffect(() => {
    if (!selectedAddressId) {
      setEditForm(emptyAddressForm);
      return;
    }

    const found = addresses.find((a) => a.id === selectedAddressId);
    if (found) {
      setEditForm({
        location_name: found.location_name ?? "",
        address: found.address,
        city: found.city,
        province: found.province,
        postal: found.postal,
      });
    }
  }, [selectedAddressId, addresses]);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm((p) => ({ ...p, [name]: value }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditSubmitting(true);
    setEditMessage(null);
    setEditError(null);

    try {
      if (!selectedClientId) {
        setEditError("Please select a client first.");
        setEditSubmitting(false);
        return;
      }
      if (!selectedAddressId) {
        setEditError("Please select an address to edit.");
        setEditSubmitting(false);
        return;
      }

      const { location_name, address, city, province, postal } = editForm;

      if (!location_name || !address || !city || !province || !postal) {
        setEditError("All fields are required.");
        setEditSubmitting(false);
        return;
      }

      const res = await apiFetch(
        `${API_BASE}/clients/${selectedClientId}/addresses/${selectedAddressId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            location_name,
            address,
            city,
            province,
            postal,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setEditError(data.error || "Failed to update address.");
      } else {
        setEditMessage(`Address "${data.location_name}" updated.`);
        await fetchAddresses(Number(selectedClientId), addressSearch, showInactive);
      }
    } catch (e) {
      console.error("Error updating address", e);
      setEditError("Unexpected error updating address.");
    } finally {
      setEditSubmitting(false);
    }
  };

  // -------------------------
  // Enable/Disable
  // -------------------------
  const toggleAddressActive = async (addressId: number, makeActive: boolean) => {
    try {
      if (!selectedClientId) return;

      const res = await apiFetch(
        `${API_BASE}/clients/${selectedClientId}/addresses/${addressId}/${makeActive ? "enable" : "disable"
        }`,
        { method: "PATCH" }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to update address status.");
        return;
      }

      await fetchAddresses(Number(selectedClientId), addressSearch, showInactive);
    } catch (e) {
      console.error("Error toggling address active", e);
      alert("Unexpected error updating address status.");
    }
  };

  return (
    <div>
      <h3 style={{ marginBottom: 0 }}>Ship-To Addresses</h3>
      <p style={{ marginBottom: 12, marginTop: 0 }}>
        Select a client, then manage that client’s shipping locations.
      </p>

      {/* Client selector */}
      <div style={{ display: "flex", justifyContent: "flex-start", gap: "5%", width: "100%" }}>
        <div style={{ marginBottom: 12, width: "100%" }}>
          <label style={{ display: "block", marginBottom: 4 }}>Search client</label>
          <input
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
            placeholder="Type client name..."
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: 12, width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={{ display: "block", marginBottom: 4 }}>Select client</label>
            <label style={{ fontSize: 14 }}>
              {/** CHANGE THIS INPUT  */}
              <input
                type="checkbox"
                checked={showInactiveClients}
                onChange={(e) => setShowInactiveClients(e.target.checked)}
                style={{ marginRight: 6 }}
              />
              Show inactive
            </label>
          </div>
          <select
            value={selectedClientId}
            onChange={(e) =>
              setSelectedClientId(e.target.value ? Number(e.target.value) : "")
            }
            style={{ width: "100%" }}
          >
            <option value="">-- Select --</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {!c.active ? "(inactive)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>
      {/* Address search (only after client selected) */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 4 }}>
          Search addresses
        </label>
        <input
          value={addressSearch}
          onChange={(e) => setAddressSearch(e.target.value)}
          placeholder='Search location name / street / city...'
          style={{ width: "100%" }}
          disabled={!selectedClientId}
        />
      </div>

      <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
        {/* Left: tabs + forms */}
        <div style={{ flex: 1, minWidth: 320 }}>
          <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => setActiveTab("add")}
              style={{
                padding: "6px 12px",
                borderRadius: 4,
                border: activeTab === "add" ? "2px solid #333" : "1px solid #ccc",
                backgroundColor: activeTab === "add" ? "#a6d2f5" : "#486882",
                cursor: "pointer",
              }}
            >
              Add Address
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              style={{
                padding: "6px 12px",
                borderRadius: 4,
                border: activeTab === "edit" ? "2px solid #333" : "1px solid #ccc",
                backgroundColor: activeTab === "edit" ? "#a6d2f5" : "#486882",
                cursor: "pointer",
              }}
            >
              Edit Address
            </button>
          </div>

          {activeTab === "add" ? (
            <>
              <h4>Add Address</h4>
              {addMessage && <div style={{ color: "green", marginBottom: 8 }}>{addMessage}</div>}
              {addError && <div style={{ color: "red", marginBottom: 8 }}>{addError}</div>}

              <form onSubmit={handleAddSubmit}>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: "block", marginBottom: 4 }}>Location Name</label>
                  <input
                    name="location_name"
                    value={addForm.location_name}
                    onChange={handleAddChange}
                    style={{ width: "100%" }}
                    disabled={!selectedClientId}
                  />
                </div>

                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: "block", marginBottom: 4 }}>Address</label>
                  <input
                    name="address"
                    value={addForm.address}
                    onChange={handleAddChange}
                    style={{ width: "100%" }}
                    disabled={!selectedClientId}
                  />
                </div>

                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 2 }}>
                    <label style={{ display: "block", marginBottom: 4 }}>City</label>
                    <input
                      name="city"
                      value={addForm.city}
                      onChange={handleAddChange}
                      style={{ width: "100%" }}
                      disabled={!selectedClientId}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", marginBottom: 4 }}>Province</label>
                    <input
                      name="province"
                      value={addForm.province}
                      onChange={handleAddChange}
                      style={{ width: "100%" }}
                      placeholder="ON"
                      disabled={!selectedClientId}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", marginBottom: 4 }}>Postal</label>
                    <input
                      name="postal"
                      value={addForm.postal}
                      onChange={handleAddChange}
                      style={{ width: "100%" }}
                      placeholder="L6T 1A1"
                      disabled={!selectedClientId}
                    />
                  </div>
                </div>

                <button type="submit" disabled={addSubmitting || !selectedClientId}>
                  {addSubmitting ? "Saving..." : "Add Address"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h4>Edit Address</h4>
              {editMessage && <div style={{ color: "green", marginBottom: 8 }}>{editMessage}</div>}
              {editError && <div style={{ color: "red", marginBottom: 8 }}>{editError}</div>}

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", marginBottom: 4 }}>
                  Select address
                </label>
                <select
                  value={selectedAddressId}
                  onChange={(e) =>
                    setSelectedAddressId(e.target.value ? Number(e.target.value) : "")
                  }
                  style={{ width: "100%" }}
                  disabled={!selectedClientId}
                >
                  <option value="">-- Select --</option>
                  {addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.location_name} — {a.city} {!a.active ? "(inactive)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <form onSubmit={handleEditSubmit}>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: "block", marginBottom: 4 }}>Location Name</label>
                  <input
                    name="location_name"
                    value={editForm.location_name}
                    onChange={handleEditChange}
                    style={{ width: "100%" }}
                    disabled={!selectedAddressId}
                  />
                </div>

                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: "block", marginBottom: 4 }}>Address</label>
                  <input
                    name="address"
                    value={editForm.address}
                    onChange={handleEditChange}
                    style={{ width: "100%" }}
                    disabled={!selectedAddressId}
                  />
                </div>

                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 2 }}>
                    <label style={{ display: "block", marginBottom: 4 }}>City</label>
                    <input
                      name="city"
                      value={editForm.city}
                      onChange={handleEditChange}
                      style={{ width: "100%" }}
                      disabled={!selectedAddressId}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", marginBottom: 4 }}>Province</label>
                    <input
                      name="province"
                      value={editForm.province}
                      onChange={handleEditChange}
                      style={{ width: "100%" }}
                      disabled={!selectedAddressId}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", marginBottom: 4 }}>Postal</label>
                    <input
                      name="postal"
                      value={editForm.postal}
                      onChange={handleEditChange}
                      style={{ width: "100%" }}
                      disabled={!selectedAddressId}
                    />
                  </div>
                </div>

                <button type="submit" disabled={editSubmitting || !selectedAddressId}>
                  {editSubmitting ? "Updating..." : "Update Address"}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Right: address list */}
        <div style={{ flex: 1, minWidth: 320 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 style={{ margin: 0 }}>Addresses for Selected Client</h4>

            <label style={{ fontSize: 14 }}>
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                style={{ marginRight: 6 }}
                disabled={!selectedClientId}
              />
              Show inactive
            </label>
          </div>

          {!selectedClientId ? (
            <p style={{ marginTop: 8 }}>Select a client to view addresses.</p>
          ) : loadingAddresses ? (
            <p style={{ marginTop: 8 }}>Loading addresses...</p>
          ) : addresses.length === 0 ? (
            <p style={{ marginTop: 8 }}>No addresses found.</p>
          ) : (
            <div
              style={{
                marginTop: 8,
                maxHeight: 240,
                overflowY: "auto",
                border: "1px solid #ddd",
                borderRadius: 4,
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr>
                    <th style={{ position: "sticky", top: 0, background: "#486882", textAlign: "left" }}>
                      Location
                    </th>
                    <th style={{ position: "sticky", top: 0, background: "#486882", textAlign: "left" }}>
                      Address
                    </th>
                    <th style={{ position: "sticky", top: 0, background: "#486882", textAlign: "left" }}>
                      Status
                    </th>
                    <th style={{ position: "sticky", top: 0, background: "#486882", textAlign: "center" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {addresses.map((a) => (
                    <tr key={a.id} style={{ opacity: a.active ? 1 : 0.6 }}>
                      <td style={{ borderBottom: "1px solid #eee", padding: "4px 6px" }}>
                        {a.location_name}
                      </td>
                      <td style={{ borderBottom: "1px solid #eee", padding: "4px 6px" }}>
                        {a.address}, {a.city}, {a.province} {a.postal}
                      </td>
                      <td style={{ borderBottom: "1px solid #eee", padding: "4px 6px" }}>
                        {a.active ? "Active" : "Inactive"}
                      </td>
                      <td style={{ borderBottom: "1px solid #eee", padding: "4px 6px", textAlign: "right" }}>
                        {a.active ? (
                          <button type="button" onClick={() => toggleAddressActive(a.id, false)}>
                            Disable
                          </button>
                        ) : (
                          <button type="button" onClick={() => toggleAddressActive(a.id, true)}>
                            Enable
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddressAdminSection;
