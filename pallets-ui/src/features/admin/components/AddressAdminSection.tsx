import React, { useEffect, useState } from "react";
import "./css/AddressAdminSection.css"

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
    <fieldset className="address-section">
      <legend>Ship-To Addresses</legend>
      <div className="address-admin">
        <header className="address-admin-header">
          <p>Select a client, then manage that client’s shipping locations.</p>


          {/* Client selector */}
          <div className="admin-form">
            <div className="field">
              <label>Search client</label>
              <input
                className="client-input"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Type client name..."
              />
            </div>

            <div className="client-field">
              <div className="client-header-with-button">
                <label className="admin-form">Select client</label>

                <label className="show-inactive-toggle">
                  <input
                    type="checkbox"
                    checked={showInactiveClients}
                    onChange={(e) => setShowInactiveClients(e.target.checked)}
                  />
                  Show&nbsp;inactive
                </label>
              </div>

              <select
                className="client-select"
                value={selectedClientId}
                onChange={(e) =>
                  setSelectedClientId(e.target.value ? Number(e.target.value) : "")
                }
              >
                <option value="">-- Select --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {!c.active ? "(inactive)" : ""}
                  </option>
                ))}
              </select>
            </div>


            {/* Address search (only after client selected) */}
            <div className="field">
              <label>Search addresses</label>
              <input
                className="address-input"
                value={addressSearch}
                onChange={(e) => setAddressSearch(e.target.value)}
                placeholder="Search location name / street / city..."
                disabled={!selectedClientId}
              />
            </div>
          </div>
        </header>

        <div className="address-admin-layout">
          {/* Left: tabs + forms */}
          <div className="address-admin-main">
            {/* Sub-tabs for Add / Edit */}
            <div className="admin-tabs address-admin-tabs">
              <button
                type="button"
                onClick={() => setActiveTab("add")}
                className={activeTab === "add" ? "active" : ""}
              >
                Add Address
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("edit")}
                className={activeTab === "edit" ? "active" : ""}
              >
                Edit Address
              </button>
            </div>

            {activeTab === "add" ? (
              <section className="admin-form">
                <h4>Add Address</h4>
                {addMessage && <div className="status success">{addMessage}</div>}
                {addError && <div className="status error">{addError}</div>}

                <form onSubmit={handleAddSubmit} className="admin-form">
                  <div className="field">
                    <label>Location Name</label>
                    <input
                      name="location_name"
                      value={addForm.location_name}
                      onChange={handleAddChange}
                      disabled={!selectedClientId}
                    />
                  </div>

                  <div className="field">
                    <label>Address</label>
                    <input
                      name="address"
                      value={addForm.address}
                      onChange={handleAddChange}
                      disabled={!selectedClientId}
                    />
                  </div>

                  <div className="field-grid">
                    <div className="field">
                      <label>City</label>
                      <input
                        name="city"
                        value={addForm.city}
                        onChange={handleAddChange}
                        disabled={!selectedClientId}
                      />
                    </div>
                    <div className="field">
                      <label>Province</label>
                      <input
                        name="province"
                        value={addForm.province}
                        onChange={handleAddChange}
                        placeholder="ON"
                        disabled={!selectedClientId}
                      />
                    </div>
                    <div className="field">
                      <label>Postal</label>
                      <input
                        name="postal"
                        value={addForm.postal}
                        onChange={handleAddChange}
                        placeholder="L6T 1A1"
                        disabled={!selectedClientId}
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={addSubmitting || !selectedClientId} className="add-admin-button">
                    {addSubmitting ? "Saving..." : "Add Address"}
                  </button>
                </form>
              </section>
            ) : (
              <section className="admin-form">
                <h4>Edit Existing Address</h4>

                {editMessage && <div className="status success">{editMessage}</div>}
                {editError && <div className="status error">{editError}</div>}

                <div className="field">
                  <label>Select address</label>
                  <select
                    value={selectedAddressId}
                    onChange={(e) =>
                      setSelectedAddressId(e.target.value ? Number(e.target.value) : "")
                    }
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

                {/* Form auto-filled with selected address */}
                <form onSubmit={handleEditSubmit} className="admin-form">
                  <div className="field">
                    <label>Location Name</label>
                    <input
                      name="location_name"
                      value={editForm.location_name}
                      onChange={handleEditChange}
                      disabled={!selectedAddressId}
                    />
                  </div>

                  <div className="field">
                    <label>Address</label>
                    <input
                      name="address"
                      value={editForm.address}
                      onChange={handleEditChange}
                      disabled={!selectedAddressId}
                    />
                  </div>

                  <div className="field-grid">
                    <div className="field">
                      <label>City</label>
                      <input
                        name="city"
                        value={editForm.city}
                        onChange={handleEditChange}
                        disabled={!selectedAddressId}
                      />
                    </div>

                    <div className="field">
                      <label>Province</label>
                      <input
                        name="province"
                        value={editForm.province}
                        onChange={handleEditChange}
                        disabled={!selectedAddressId}
                      />
                    </div>

                    <div className="field">
                      <label>Postal</label>
                      <input
                        name="postal"
                        value={editForm.postal}
                        onChange={handleEditChange}
                        disabled={!selectedAddressId}
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={editSubmitting || !selectedAddressId} className="update-admin-button">
                    {editSubmitting ? "Updating..." : "Update Address"}
                  </button>
                </form>
              </section>
            )}
          </div>

          {/* Right side: existing address list with scroll */}
          <aside className="address-admin-sidebar">

            {/*Existing address + Checkbox */}
            <div className="address-admin-sidebar-header">
              <h4>Addresses for Selected Client</h4>

              <label className="show-inactive-toggle">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  disabled={!selectedClientId}
                />
                Show&nbsp;inactive
              </label>
            </div>

            {!selectedClientId ? (
              <p>Select a client to view addresses.</p>
            ) : loadingAddresses ? (
              <p>Loading addresses...</p>
            ) : addresses.length === 0 ? (
              <p>No addresses found.</p>
            ) : (
              <div className="address-table-wrapper">
                {/*Table header */}
                <table className="admin-table address-admin-table">
                  <thead>
                    <tr>
                      <th>Location</th>
                      <th>Address</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {addresses.map((a) => (
                      <tr key={a.id} className={!a.active ? "inactive" : undefined}>
                        <td>{a.location_name}</td>
                        <td>{a.address}, {a.city}, {a.province} {a.postal}</td>
                        <td>{a.active ? "Active" : "Inactive"}</td>
                        <td className="actions">
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
          </aside>
        </div>
      </div>
    </fieldset>
  );
};

export default AddressAdminSection;
