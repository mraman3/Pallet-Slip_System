// src/features/admin/components/ClientAdminSection.tsx
import React, { useEffect, useState } from "react";
import "./css/ClientAdminSection.css"
import "../AdminPage.css"

//import api 
import { API_BASE } from "../../../config/api";
import { apiFetch } from "../../../config/apiFetch";

// Types
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

/**
 * ClientAdminSection
 *
 * Responsibilities:
 * - Add / edit sold-to clients
 * - Enable / disable clients
 *
 * Non-responsibilities:
 * - Address management
 * - Routing
 */
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

      const res = await apiFetch(`${API_BASE}/clients?${params.toString()}`, { signal });
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

      const res = await apiFetch(`${API_BASE}/clients`, {
        method: "POST",
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

      const res = await apiFetch(`${API_BASE}/clients/${selectedEditClientId}`, {
        method: "PUT",
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
      const res = await apiFetch(
        `${API_BASE}/clients/${clientId}/${makeActive ? "enable" : "disable"}`,
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
    <fieldset className="client-section">
      <legend>Sold-To Clients</legend>
      <div className="client-admin">
        <header className="client-admin-header">
          <p>Select a client to manage.</p>
        </header>

        <div className="client-admin-layout">
          {/* Left side: tabs + forms */}
          <div className="client-admin-main">
            {/* Sub-tabs for Add / Edit */}
            <div className="admin-tabs client-admin-tabs">
              <button
                type="button"
                onClick={() => setActiveTab("add")}
                className={activeTab === "add" ? "active" : ""}
              >
                Add Client
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("edit")}
                className={activeTab === "edit" ? "active" : ""}
              >
                Edit Client
              </button>
            </div>

            {activeTab === "add" ? (
              /** LEFT SIDE ADD client */
              <section className="admin-form">
                <h4>Add New Client</h4>

                {addMessage && (
                  <div className="status success">
                    {addMessage}
                  </div>
                )}
                {addError && (
                  <div className="status error">
                    {addError}
                  </div>
                )}


                <form onSubmit={handleAddSubmit} className="admin-form">
                  <div className="field">
                    <label>Client Name</label>
                    <input
                      name="name"
                      type="text"
                      value={addForm.name}
                      onChange={handleAddChange}
                    />
                  </div>

                  <div className="field">
                    <label>Address</label>
                    <input
                      name="address"
                      type="text"
                      value={addForm.address}
                      onChange={handleAddChange}
                    />
                  </div>

                  <div className="field-grid">
                    <div className="field">
                      <label>City</label>
                      <input
                        name="city"
                        type="text"
                        value={addForm.city}
                        onChange={handleAddChange}
                      />
                    </div>

                    <div className="field">
                      <label>Province</label>
                      <input
                        name="province"
                        type="text"
                        value={addForm.province}
                        onChange={handleAddChange}
                        placeholder="ON"
                      />
                    </div>

                    <div className="field">
                      <label>Postal</label>
                      <input
                        name="postal"
                        type="text"
                        value={addForm.postal}
                        onChange={handleAddChange}
                        placeholder="L6T 1A1"
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={addSubmitting} className="add-admin-button">
                    {addSubmitting ? "Saving..." : "Add Client"}
                  </button>
                </form>
              </section>
            ) : (
              /** LEFT SIDE Edit Client */
              <section className="admin-form">
                <h4>Edit Existing Client</h4>

                {editMessage && (
                  <div className="status success">
                    {editMessage}
                  </div>
                )}
                {editError && (
                  <div className="status error">
                    {editError}
                  </div>
                )}

                {/* Search + select client (like slip form) */}
                <div className="client-admin-search">
                  <div className="field">
                    <label>Search client</label>
                    <input
                      type="text"
                      value={editSearch}
                      onChange={(e) => setEditSearch(e.target.value)}
                      placeholder="Type client name..."
                    />
                  </div>

                  <div className="field">
                    <label>Select client</label>
                    <select
                      value={selectedEditClientId}
                      onChange={(e) =>
                        setSelectedEditClientId(
                          e.target.value ? Number(e.target.value) : ""
                        )
                      }
                    >
                      <option value="">-- Select --</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — {c.city}, {c.province} {!c.active && showInactive ? "   (inactive)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Form auto-filled with selected client */}
                <form onSubmit={handleEditSubmit} className="admin-form">
                  <div className="field">
                    <label>Client Name</label>
                    <input
                      name="name"
                      type="text"
                      value={editForm.name}
                      onChange={handleEditChange}
                      disabled={!selectedEditClientId}
                    />
                  </div>

                  <div className="field">
                    <label>Address</label>
                    <input
                      name="address"
                      type="text"
                      value={editForm.address}
                      onChange={handleEditChange}
                      disabled={!selectedEditClientId}
                    />
                  </div>

                  <div className="field-grid">
                    <div className="field">
                      <label>City</label>
                      <input
                        name="city"
                        type="text"
                        value={editForm.city}
                        onChange={handleEditChange}
                        disabled={!selectedEditClientId}
                      />
                    </div>

                    <div className="field">
                      <label>Province</label>
                      <input
                        name="province"
                        type="text"
                        value={editForm.province}
                        onChange={handleEditChange}
                        placeholder="ON"
                        disabled={!selectedEditClientId}
                      />
                    </div>

                    <div className="field">
                      <label>Postal</label>
                      <input
                        name="postal"
                        type="text"
                        value={editForm.postal}
                        onChange={handleEditChange}
                        placeholder="L6T 1A1"
                        disabled={!selectedEditClientId}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={editSubmitting || !selectedEditClientId}
                    className="update-admin-button"
                  >
                    {editSubmitting ? "Updating..." : "Update Client"}
                  </button>
                </form>

              </section>
            )}
          </div>

          {/* Right side: existing clients list with scroll */}
          <aside className="client-admin-sidebar">

            {/*Existing Clients + Checkbox */}
            <div className="client-admin-sidebar-header">
              <h4>Existing Clients</h4>
              <label className="show-inactive-toggle">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                />
                Show inactive
              </label>
            </div>


            {loading ? (
              <p>Loading clients...</p>
            ) : clients.length === 0 ? (
              <p>No clients found.</p>
            ) : (
              <div className="client-table-wrapper">
                {/*Table header */}
                <table className="admin-table client-admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>City</th>
                      <th>Province</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((c) => (
                      <tr key={c.id} className={!c.active ? "inactive" : undefined}>
                        <td>{c.name}</td>
                        <td>{c.city}</td>
                        <td>{c.province}</td>
                        <td>{c.active ? "Active" : "Inactive"}</td>
                        <td className="actions">
                          {c.active ? (
                            <button type="button" onClick={() => toggleClientActive(c.id, false)}>
                              Disable
                            </button>
                          ) : (
                            <button type="button" onClick={() => toggleClientActive(c.id, true)}>
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

export default ClientAdminSection;
