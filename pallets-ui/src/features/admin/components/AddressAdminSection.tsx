// src/features/admin/components/AddressAdminSection.tsx
import React, { useEffect, useState } from "react";
import type { Client, ClientAddress } from "../../../types/domain";

const emptyAddressForm = {
  location_name: "",
  address: "",
  city: "",
  province: "",
  postal: "",
};

const AddressAdminSection: React.FC = () => {
  // which tab is active: "add" or "edit"
  const [activeTab, setActiveTab] = useState<"add" | "edit">("add");

  // client search + select
  const [clientSearch, setClientSearch] = useState("");
  const [clientResults, setClientResults] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | "">("");

  // addresses for selected client
  const [addresses, setAddresses] = useState<ClientAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // add address form
  const [addForm, setAddForm] = useState(emptyAddressForm);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addMessage, setAddMessage] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  // edit address selection + form
  const [selectedAddressId, setSelectedAddressId] = useState<number | "">("");
  const [editForm, setEditForm] = useState(emptyAddressForm);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editMessage, setEditMessage] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // ---- client search (same style as other screens) ----
  useEffect(() => {
    const controller = new AbortController();

    const searchClients = async () => {
      try {
        const params = new URLSearchParams();
        if (clientSearch.trim()) {
          params.set("search", clientSearch.trim());
        }

        const res = await fetch(`/api/clients?${params.toString()}`, {
          signal: controller.signal,
        });
        const data: Client[] = await res.json();
        setClientResults(data);
      } catch (err) {
        if ((err as any).name === "AbortError") return;
        console.error("Error searching clients for addresses", err);
      }
    };

    const timeout = setTimeout(searchClients, 300);
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [clientSearch]);

  // ---- load addresses when a client is selected ----
  const loadAddressesForClient = async (clientId: number) => {
    try {
      setLoadingAddresses(true);
      const res = await fetch(`/api/clients/${clientId}/addresses`);
      const data: ClientAddress[] = await res.json();
      setAddresses(data);

      // reset selection and edit form
      setSelectedAddressId("");
      setEditForm(emptyAddressForm);
    } catch (err) {
      console.error("Error loading addresses", err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (!selectedClientId) {
      setAddresses([]);
      setSelectedAddressId("");
      setEditForm(emptyAddressForm);
      return;
    }
    void loadAddressesForClient(selectedClientId);
  }, [selectedClientId]);

  // ---- add address handlers ----
  const handleAddChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddForm((prev) => ({
      ...prev,
      [name]: value,
    }));
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

      if (!address || !city || !province || !postal) {
        setAddError("Address, city, province, and postal are required.");
        setAddSubmitting(false);
        return;
      }

      const res = await fetch(`/api/clients/${selectedClientId}/addresses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location_name: location_name || null,
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
        setAddMessage("Address added.");
        setAddForm(emptyAddressForm);
        if (selectedClientId) {
          void loadAddressesForClient(selectedClientId);
        }
      }
    } catch (err) {
      console.error("Error creating address", err);
      setAddError("Unexpected error creating address.");
    } finally {
      setAddSubmitting(false);
    }
  };

  // ---- edit address handlers ----
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // when an address is selected, populate edit form
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

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditSubmitting(true);
    setEditMessage(null);
    setEditError(null);

    try {
      if (!selectedAddressId) {
        setEditError("Please select an address to edit.");
        setEditSubmitting(false);
        return;
      }

      const { location_name, address, city, province, postal } = editForm;

      if (!address || !city || !province || !postal) {
        setEditError("Address, city, province, and postal are required.");
        setEditSubmitting(false);
        return;
      }

      const res = await fetch(`/api/clients/${selectedClientId}/addresses/${selectedAddressId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location_name: location_name || null,
          address,
          city,
          province,
          postal,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEditError(data.error || "Failed to update address.");
      } else {
        setEditMessage("Address updated.");
        if (selectedClientId) {
          void loadAddressesForClient(selectedClientId);
        }
      }
    } catch (err) {
      console.error("Error updating address", err);
      setEditError("Unexpected error updating address.");
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div>
      <h3 style={{ marginBottom: 0 }}>Ship-To Addresses</h3>
      <p style={{ marginBottom: 15, marginTop: 0}}>
        Select a client to manage its Ship-To locations.
      </p>

      {/* Client picker */}
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "flex-end",
          marginBottom: 16,
        }}
      >
        <div style={{ flex: 2 }}>
          <label style={{ display: "block", marginBottom: 4 }}>
            Search client
          </label>
          <input
            type="text"
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
            placeholder="Type client name..."
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ flex: 2 }}>
          <label style={{ display: "block", marginBottom: 4 }}>
            Select client
          </label>
          <select
            value={selectedClientId}
            onChange={(e) =>
              setSelectedClientId(
                e.target.value ? Number(e.target.value) : ""
              )
            }
            style={{ width: "100%" }}
          >
            <option value="">-- Select --</option>
            {clientResults.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.city}, {c.province}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Layout: left = forms (tabbed), right = list */}
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        {/* Left column: tabs + forms */}
        <div style={{ flex: 1, minWidth: 320 }}>
          {/* sub-tabs */}
          <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => setActiveTab("add")}
              style={{
                padding: "6px 12px",
                borderRadius: 4,
                border:
                  activeTab === "add" ? "2px solid #333" : "1px solid #ccc",
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
                border:
                  activeTab === "edit" ? "2px solid #333" : "1px solid #ccc",
                backgroundColor: activeTab === "edit" ? "#a6d2f5" : "#486882",
                cursor: "pointer",
              }}
            >
              Edit Address
            </button>
          </div>

          {activeTab === "add" ? (
            <section>
              <h4>Add Ship - To Address For Client</h4>

              {addMessage && (
                <div style={{ marginBottom: 8, color: "green" }}>
                  {addMessage}
                </div>
              )}
              {addError && (
                <div style={{ marginBottom: 8, color: "red" }}>
                  {addError}
                </div>
              )}

              <form onSubmit={handleAddSubmit}>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: "block", marginBottom: 4 }}>
                    Location Name (optional)
                  </label>
                  <input
                    name="location_name"
                    type="text"
                    value={addForm.location_name}
                    onChange={handleAddChange}
                    style={{ width: "100%" }}
                    disabled={!selectedClientId}
                    placeholder="e.g. Main Yard, Plant #2"
                  />
                </div>

                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: "block", marginBottom: 4 }}>
                    Address
                  </label>
                  <input
                    name="address"
                    type="text"
                    value={addForm.address}
                    onChange={handleAddChange}
                    style={{ width: "100%" }}
                    disabled={!selectedClientId}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <div style={{ flex: 2 }}>
                    <label
                      style={{ display: "block", marginBottom: 4 }}
                    >
                      City
                    </label>
                    <input
                      name="city"
                      type="text"
                      value={addForm.city}
                      onChange={handleAddChange}
                      style={{ width: "100%" }}
                      disabled={!selectedClientId}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <label
                      style={{ display: "block", marginBottom: 4 }}
                    >
                      Province
                    </label>
                    <input
                      name="province"
                      type="text"
                      value={addForm.province}
                      onChange={handleAddChange}
                      style={{ width: "100%" }}
                      disabled={!selectedClientId}
                      placeholder="ON"
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <label
                      style={{ display: "block", marginBottom: 4 }}
                    >
                      Postal
                    </label>
                    <input
                      name="postal"
                      type="text"
                      value={addForm.postal}
                      onChange={handleAddChange}
                      style={{ width: "100%" }}
                      disabled={!selectedClientId}
                      placeholder="L6T 1A1"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={addSubmitting || !selectedClientId}
                >
                  {addSubmitting ? "Saving..." : "Add Address"}
                </button>
              </form>
            </section>
          ) : (
            <section>
              <h4>Edit Ship - To Address For Existing Client</h4>

              {editMessage && (
                <div style={{ marginBottom: 8, color: "green" }}>
                  {editMessage}
                </div>
              )}
              {editError && (
                <div style={{ marginBottom: 8, color: "red" }}>
                  {editError}
                </div>
              )}

              <div style={{ marginBottom: 8 }}>
                <label style={{ display: "block", marginBottom: 4 }}>
                  Select address
                </label>
                <select
                  value={selectedAddressId}
                  onChange={(e) =>
                    setSelectedAddressId(
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                  style={{ width: "100%" }}
                  disabled={!selectedClientId || addresses.length === 0}
                >
                  <option value="">-- Select --</option>
                  {addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.location_name ? `${a.location_name} — ` : ""}
                      {a.address}, {a.city}
                    </option>
                  ))}
                </select>
              </div>

              <form onSubmit={handleEditSubmit}>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: "block", marginBottom: 4 }}>
                    Location Name (optional)
                  </label>
                  <input
                    name="location_name"
                    type="text"
                    value={editForm.location_name}
                    onChange={handleEditChange}
                    style={{ width: "100%" }}
                    disabled={!selectedAddressId}
                  />
                </div>

                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: "block", marginBottom: 4 }}>
                    Address
                  </label>
                  <input
                    name="address"
                    type="text"
                    value={editForm.address}
                    onChange={handleEditChange}
                    style={{ width: "100%" }}
                    disabled={!selectedAddressId}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <div style={{ flex: 2 }}>
                    <label
                      style={{ display: "block", marginBottom: 4 }}
                    >
                      City
                    </label>
                    <input
                      name="city"
                      type="text"
                      value={editForm.city}
                      onChange={handleEditChange}
                      style={{ width: "100%" }}
                      disabled={!selectedAddressId}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <label
                      style={{ display: "block", marginBottom: 4 }}
                    >
                      Province
                    </label>
                    <input
                      name="province"
                      type="text"
                      value={editForm.province}
                      onChange={handleEditChange}
                      style={{ width: "100%" }}
                      disabled={!selectedAddressId}
                      placeholder="ON"
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <label
                      style={{ display: "block", marginBottom: 4 }}
                    >
                      Postal
                    </label>
                    <input
                      name="postal"
                      type="text"
                      value={editForm.postal}
                      onChange={handleEditChange}
                      style={{ width: "100%" }}
                      disabled={!selectedAddressId}
                      placeholder="L6T 1A1"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={editSubmitting || !selectedAddressId}
                >
                  {editSubmitting ? "Updating..." : "Update Address"}
                </button>
              </form>
            </section>
          )}
        </div>

        {/* Right column: address list */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <h4>Addresses for Selected Client</h4>

          {loadingAddresses ? (
            <p>Loading addresses...</p>
          ) : !selectedClientId ? (
            <p>Select a client to view addresses.</p>
          ) : addresses.length === 0 ? (
            <p>No addresses yet for this client.</p>
          ) : (
            <div
              style={{
                maxHeight: "200px",
                overflowY: "auto",
                border: "1px solid #ddd",
                borderRadius: 4,
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 14,
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        borderBottom: "1px solid #ccc",
                        textAlign: "left",
                        padding: "4px 2px",
                        position: "sticky",
                        top: 0,
                        background: "#486882",
                      }}
                    >
                      Location
                    </th>
                    <th
                      style={{
                        borderBottom: "1px solid #ccc",
                        textAlign: "left",
                        padding: "4px 2px",
                        position: "sticky",
                        top: 0,
                        background: "#486882",
                      }}
                    >
                      Address
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {addresses.map((a) => (
                    <tr key={a.id}>
                      <td
                        style={{
                          borderBottom: "1px solid #eee",
                          padding: "4px 2px",
                        }}
                      >
                        {a.location_name || <em>(none)</em>}
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #eee",
                          padding: "4px 2px",
                        }}
                      >
                        {a.address}, {a.city}
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
