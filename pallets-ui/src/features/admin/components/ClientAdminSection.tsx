// src/features/admin/components/ClientAdminSection.tsx
import React, { useEffect, useState } from "react";
import type { Client } from "../../../types/domain";

const emptyForm = {
  name: "",
  address: "",
  city: "",
  province: "",
  postal: "",
};

type Props = {
  onClientChanged?: () => void;
};

const ClientAdminSection: React.FC<Props> = ({ onClientChanged }) => {

  // ---- SHARED STATE ----
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [showInactive, setShowInactive] = useState(false);


  // tabs: "add" or "edit"
  const [activeTab, setActiveTab] = useState<"add" | "edit">("add");

  // ---- ADD CLIENT STATE ----
  const [addForm, setAddForm] = useState(emptyForm);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addMessage, setAddMessage] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  // ---- EDIT CLIENT STATE ----
  const [editSearch, setEditSearch] = useState("");
  const [selectedEditClientId, setSelectedEditClientId] = useState<number | "">("");
  const [editForm, setEditForm] = useState(emptyForm);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editMessage, setEditMessage] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // ---- load / search clients (used for sidebar + optional reuse) ----
  const fetchClients = async (
    searchValue: string,
    includeInactive: boolean,
    signal?: AbortSignal
  ) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (searchValue.trim()) params.set("search", searchValue.trim());
      if (includeInactive) params.set("includeInactive", "true");

      const res = await fetch(`/api/clients?${params.toString()}`, { signal });
      const data: Client[] = await res.json();
      setClients(data);
    } catch (err) {
      if ((err as any).name === "AbortError") return;
      console.error("Error loading clients", err);
    } finally {
      setLoading(false);
    }
  };

  // Unified client query: handles search + inactive filter
  useEffect(() => {
    const controller = new AbortController();

    const isSearching = editSearch.trim().length > 0;

    const timeout = setTimeout(() => {
      fetchClients(
        isSearching ? editSearch : "",
        showInactive,
        controller.signal
      );
    }, isSearching ? 300 : 0);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [editSearch, showInactive]);


  // ---- ADD CLIENT HANDLERS ----
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
      const { name, address, city, province, postal } = addForm;

      if (!name || !address || !city || !province || !postal) {
        setAddError("All fields are required.");
        setAddSubmitting(false);
        return;
      }

      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          address,
          city,
          province,
          postal,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAddError(data.error || "Failed to create client.");
      } else {
        setAddMessage(`Client "${data.name}" created.`);
        setAddForm(emptyForm);
        // refresh the sidebar list
        await fetchClients("", showInactive);
        onClientChanged?.();
      }
    } catch (err) {
      console.error("Error creating client", err);
      setAddError("Unexpected error creating client.");
    } finally {
      setAddSubmitting(false);
    }
  };

  // ---- EDIT CLIENT: when a client is selected, populate form ----
  useEffect(() => {
    if (!selectedEditClientId) {
      setEditForm(emptyForm);
      return;
    }

    const found = clients.find((c) => c.id === selectedEditClientId);

    if (found) {
      setEditForm({
        name: found.name,
        address: found.address,
        city: found.city,
        province: found.province,
        postal: found.postal,
      });
    }
  }, [selectedEditClientId, clients]);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditSubmitting(true);
    setEditMessage(null);
    setEditError(null);

    try {
      if (!selectedEditClientId) {
        setEditError("Please select a client to edit.");
        setEditSubmitting(false);
        return;
      }

      const { name, address, city, province, postal } = editForm;

      if (!name || !address || !city || !province || !postal) {
        setEditError("All fields are required.");
        setEditSubmitting(false);
        return;
      }

      const res = await fetch(`/api/clients/${selectedEditClientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          address,
          city,
          province,
          postal,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEditError(data.error || "Failed to update client.");
      } else {
        setEditMessage(`Client "${data.name}" updated.`);
        // refresh sidebar and maybe editResults
        await fetchClients("", showInactive);
        onClientChanged?.();
      }
    } catch (err) {
      console.error("Error updating client", err);
      setEditError("Unexpected error updating client.");
    } finally {
      setEditSubmitting(false);
    }
  };

  // ---- Enable and Disable Client ----
  const toggleClientActive = async (clientId: number, makeActive: boolean) => {
    try {
      const res = await fetch(
        `/api/clients/${clientId}/${makeActive ? "enable" : "disable"}`,
        { method: "PATCH" }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to update client status.");
        return;
      }

      // refresh sidebar list
      await fetchClients("", showInactive);
      onClientChanged?.();
    } catch (err) {
      console.error("Error toggling client active", err);
      alert("Unexpected error updating client status.");
    }
  };

  return (
    <div >
      <h3 style={{ marginBottom: 0 }}>Sold-To Clients</h3>
      <p style={{ marginBottom: 15, marginTop: 0 }}>
        Select a client to manage.
      </p>
      <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
        {/* Left side: tabs + forms */}
        <div style={{ flex: 1, minWidth: 320 }}>
          {/* Sub-tabs for Add / Edit */}
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
              Add Client
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
              Edit Client
            </button>
          </div>

          {activeTab === "add" ? (
            /** LEFT SIDE ADD client */
            <>
              <h3>Add New Client</h3>

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
                    Client Name
                  </label>
                  <input
                    name="name"
                    type="text"
                    value={addForm.name}
                    onChange={handleAddChange}
                    style={{ width: "100%" }}
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
                      placeholder="L6T 1A1"
                    />
                  </div>
                </div>

                <button type="submit" disabled={addSubmitting}>
                  {addSubmitting ? "Saving..." : "Add Client"}
                </button>
              </form>
            </>
          ) : (
            /** LEFT SIDE Edit Client */
            <>
              <h3>Edit Existing Client</h3>

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

              {/* Search + select client (like slip form) */}
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: "block", marginBottom: 4 }}>
                  Search client
                </label>
                <input
                  type="text"
                  value={editSearch}
                  onChange={(e) => setEditSearch(e.target.value)}
                  placeholder="Type client name..."
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", marginBottom: 4 }}>
                  Select client
                </label>
                <select
                  value={selectedEditClientId}
                  onChange={(e) =>
                    setSelectedEditClientId(
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                  style={{ width: "100%" }}
                >
                  <option value="">-- Select --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.city}, {c.province} {!c.active && showInactive ? "   (inactive)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Form auto-filled with selected client */}
              <form onSubmit={handleEditSubmit}>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: "block", marginBottom: 4 }}>
                    Client Name
                  </label>
                  <input
                    name="name"
                    type="text"
                    value={editForm.name}
                    onChange={handleEditChange}
                    style={{ width: "100%" }}
                    disabled={!selectedEditClientId}
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
                    disabled={!selectedEditClientId}
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
                      disabled={!selectedEditClientId}
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
                      placeholder="ON"
                      disabled={!selectedEditClientId}
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
                      placeholder="L6T 1A1"
                      disabled={!selectedEditClientId}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={editSubmitting || !selectedEditClientId}
                >
                  {editSubmitting ? "Updating..." : "Update Client"}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Right side: existing clients list with scroll */}
        <div style={{ flex: 1, minWidth: 300 }}>

          {/*Existing Clients + Checkbox */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ margin: 0 }}>Existing Clients</h3>
            <label style={{ fontSize: 14 }}>
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                style={{ marginRight: 6 }}
              />
              Show inactive
            </label>
          </div>


          {loading ? (
            <p>Loading clients...</p>
          ) : clients.length === 0 ? (
            <p>No clients found.</p>
          ) : (
            <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #ddd", borderRadius: 4, }}>
              {/*Table header */}
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, }}>
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
                      Name
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
                      City
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
                      Province
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
                      Status
                    </th>

                    <th
                      style={{
                        borderBottom: "1px solid #ccc",
                        textAlign: "center",
                        padding: "4px 2px",
                        position: "sticky",
                        top: 0,
                        background: "#486882",
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr key={c.id} style={{ opacity: c.active ? 1 : 0.6 }}>
                      <td
                        style={{
                          borderBottom: "1px solid #eee",
                          padding: "4px 2px",
                        }}
                      >
                        {c.name}
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #eee",
                          padding: "4px 2px",
                        }}
                      >
                        {c.city}
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #eee",
                          padding: "4px 2px",
                        }}
                      >
                        {c.province}
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #eee",
                          padding: "4px 2px",
                        }}
                      >
                        {c.active ? "Active" : "Inactive"}
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #eee",
                          padding: "4px",
                          textAlign: "right",
                          whiteSpace: "nowrap",
                          width: "0%"
                        }}
                      >
                        {c.active ? (
                          <button
                            type="button"
                            onClick={() => toggleClientActive(c.id, false)}
                            style={{ cursor: "pointer" }}
                          >
                            Disable
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleClientActive(c.id, true)}
                            style={{ cursor: "pointer" }}
                          >
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

export default ClientAdminSection;
