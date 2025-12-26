// src/features/admin/components/PalletAdminSection.tsx
import React, { useEffect, useState } from "react";
import "./css/PalletAdminSection.css"

//import api 
import { API_BASE } from "../../../config/api";
import { apiFetch } from "../../../config/apiFetch";

import type { PalletType } from "../../../types/domain";

const emptyPalletForm = {
  name: "",
};

const PalletAdminSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"add" | "edit">("add");

  // shared pallet state
  const [palletSearch, setPalletSearch] = useState("");
  const [pallets, setPallets] = useState<PalletType[]>([]);
  const [loading, setLoading] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  // add form state
  const [addForm, setAddForm] = useState(emptyPalletForm);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addMessage, setAddMessage] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  // edit form state
  const [selectedPalletId, setSelectedPalletId] = useState<number | "">("");
  const [editForm, setEditForm] = useState(emptyPalletForm);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editMessage, setEditMessage] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // ---- load / search pallet types ----
  const fetchPallets = async (
    searchValue: string,
    includeInactive: boolean,
    signal?: AbortSignal
  ) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (searchValue.trim()) params.set("search", searchValue.trim());
      if (includeInactive) params.set("includeInactive", "true");

      const res = await apiFetch(`${API_BASE}/pallet-types?${params.toString()}`, { signal });
      const data: PalletType[] = await res.json();
      setPallets(data);
    } catch (err) {
      if ((err as any).name === "AbortError") return;
      console.error("Error loading pallet types", err);
    } finally {
      setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    const controller = new AbortController();
    fetchPallets("", false, controller.signal);
    return () => controller.abort();
  }, []);

  // search debounce
  useEffect(() => {
    const controller = new AbortController();

    const t = setTimeout(() => {
      fetchPallets(palletSearch, showInactive, controller.signal);
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [palletSearch, showInactive]);

  // ---- add handlers ----
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
      const { name } = addForm;

      if (!name.trim()) {
        setAddError("Pallet type name is required.");
        setAddSubmitting(false);
        return;
      }

      const res = await apiFetch(`${API_BASE}/pallet-types`, {
        method: "POST",
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAddError(data.error || "Failed to create pallet type.");
      } else {
        setAddMessage(`Pallet type "${data.name}" created.`);
        setAddForm(emptyPalletForm);
        void fetchPallets(palletSearch, showInactive);
      }
    } catch (err) {
      console.error("Error creating pallet type", err);
      setAddError("Unexpected error creating pallet type.");
    } finally {
      setAddSubmitting(false);
    }
  };

  // ---- edit handlers ----
  useEffect(() => {
    if (!selectedPalletId) {
      setEditForm(emptyPalletForm);
      return;
    }
    const found = pallets.find((p) => p.id === selectedPalletId);
    if (found) {
      setEditForm({ name: found.name });
    }
  }, [selectedPalletId, pallets]);

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
      if (!selectedPalletId) {
        setEditError("Please select a pallet type to edit.");
        setEditSubmitting(false);
        return;
      }

      const { name } = editForm;

      if (!name.trim()) {
        setEditError("Pallet type name is required.");
        setEditSubmitting(false);
        return;
      }

      const res = await apiFetch(`${API_BASE}/pallet-types/${selectedPalletId}`, {
        method: "PUT",
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEditError(data.error || "Failed to update pallet type.");
      } else {
        setEditMessage(`Pallet type "${data.name}" updated.`);
        void fetchPallets(palletSearch, showInactive);
      }
    } catch (err) {
      console.error("Error updating pallet type", err);
      setEditError("Unexpected error updating pallet type.");
    } finally {
      setEditSubmitting(false);
    }
  };

  // ---- Active handlers ----
  const togglePalletActive = async (palletId: number, makeActive: boolean) => {
    try {
      const res = await apiFetch(
        `${API_BASE}/pallet-types/${palletId}/${makeActive ? "enable" : "disable"}`,
        { method: "PATCH" }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to update pallet type status.");
        return;
      }

      // refresh list (keeps your search + showInactive filter)
      await fetchPallets(palletSearch, showInactive);
    } catch (err) {
      console.error("Error toggling palletType active", err);
      alert("Unexpected error updating pallet type status.");
    }
  };

  return (
    <fieldset className="pallet-section">
      <legend>Pallet Types</legend>
      <div className="pallet-admin">
        <header className="pallet-admin-header">
          <p>Manage the list of pallet types available on slips.</p>
        </header>

        {/* Layout: left = forms with tabs, right = list */}
        <div className="pallet-admin-layout">

          {/* Left: tabs + forms */}
          <div className="pallet-admin-main">
            {/* Tabs */}
            <div className="admin-tabs pallet-admin-tabs">
              <button
                type="button"
                onClick={() => setActiveTab("add")}
                className={activeTab === "add" ? "active" : ""}
              >
                Add Pallet Type
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("edit")}
                className={activeTab === "edit" ? "active" : ""}
              >
                Edit Pallet Type
              </button>
            </div>

            {/* Search bar (used for list + edit dropdown) */}
            <div className="field">
              <label>Search pallet types</label>
              <input
                type="text"
                value={palletSearch}
                onChange={(e) => setPalletSearch(e.target.value)}
                placeholder='e.g. 48"x40" #2 4-way'
              />
            </div>

            {activeTab === "add" ? (
              <section className="admin-form">
                <h4>Add Pallet Type</h4>
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
                    <label>Name / Description</label>
                    <input
                      name="name"
                      type="text"
                      value={addForm.name}
                      onChange={handleAddChange}
                      placeholder='e.g. 48" x 40" #2 4-way'
                    />
                  </div>

                  <button type="submit" disabled={addSubmitting} className="add-admin-button">
                    {addSubmitting ? "Saving..." : "Add Pallet Type"}
                  </button>
                </form>
              </section>
            ) : (
              <section className="admin-form">
                <h4>Edit Pallet Type</h4>

                {editMessage && <div className="status success">{editMessage}</div>}
                {editError && <div className="status error">{editError}</div>}

                <div className="field">
                  <label>Select pallet type</label>
                  <select
                    value={selectedPalletId}
                    onChange={(e) =>
                      setSelectedPalletId(
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                  >
                    <option value="">-- Select --</option>
                    {pallets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {p.active === false ? " (inactive)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Form auto-filled with selected pallet */}
                <form onSubmit={handleEditSubmit} className="admin-form">
                  <div className="field">
                    <label>Name / Description</label>
                    <input
                      name="name"
                      type="text"
                      value={editForm.name}
                      onChange={handleEditChange}
                      disabled={!selectedPalletId}
                    />
                  </div>

                  <button type="submit" disabled={editSubmitting || !selectedPalletId} className="update-admin-button">
                    {editSubmitting ? "Updating..." : "Update Pallet Type"}
                  </button>
                </form>
              </section>
            )}
          </div>

          {/* Right: pallet type list */}
          <aside className="pallet-admin-sidebar">
            <div className="pallet-admin-sidebar-header">
              <h4>Existing Pallet Types</h4>
              <label className="show-inactive-toggle">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                />
                Show&nbsp;inactive
              </label>
            </div>

            {loading ? (
              <p>Loading pallet types...</p>
            ) : pallets.length === 0 ? (
              <p>No pallet types found.</p>
            ) : (
              <div className="pallet-table-wrapper">
                {/*Table header */}
                <table className="admin-table pallet-admin-table">
                  <thead>
                    <tr>
                      <th>Name / Description</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pallets.map((p) => (
                      <tr key={p.id} className={!p.active ? "inactive" : undefined}>
                        <td>{p.name}</td>
                        <td>{p.active ? "Active" : "Inactive"}</td>
                        <td className="actions">
                          {p.active ? (
                            <button type="button" onClick={() => togglePalletActive(p.id, false)}>
                              Disable
                            </button>
                          ) : (
                            <button type="button" onClick={() => togglePalletActive(p.id, true)}>
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

export default PalletAdminSection;
