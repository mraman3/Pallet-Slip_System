// src/features/admin/components/PalletAdminSection.tsx
import React, { useEffect, useState } from "react";

//import api 
import { API_BASE } from "../../../config/api";

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

      const res = await fetch(`${API_BASE}/pallet-types?${params.toString()}`, { signal });
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

      const res = await fetch(`${API_BASE}/pallet-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      const res = await fetch(`${API_BASE}/pallet-types/${selectedPalletId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
      const res = await fetch(
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
    <div>
      <h3 style={{ marginBottom: 0 }}>Pallet Types</h3>
      <p style={{ marginBottom: 12, marginTop: 0 }}>
        Manage the list of pallet types available on slips.
      </p>

      {/* Search bar (used for list + edit dropdown) */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 4 }}>
          Search pallet types
        </label>
        <input
          type="text"
          value={palletSearch}
          onChange={(e) => setPalletSearch(e.target.value)}
          placeholder='e.g. 48"x40" #2 4-way'
          style={{ width: "100%" }}
        />
      </div>

      {/* Layout: left = forms with tabs, right = list */}
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        {/* Left: tabs + forms */}
        <div style={{ flex: 1, minWidth: 320 }}>
          {/* Tabs */}
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
              Add Pallet Type
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
              Edit Pallet Type
            </button>
          </div>

          {activeTab === "add" ? (
            <section>
              <h4>Add Pallet Type</h4>

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
                    Name / Description
                  </label>
                  <input
                    name="name"
                    type="text"
                    value={addForm.name}
                    onChange={handleAddChange}
                    style={{ width: "100%" }}
                    placeholder='e.g. 48" x 40" #2 4-way'
                  />
                </div>

                <button type="submit" disabled={addSubmitting}>
                  {addSubmitting ? "Saving..." : "Add Pallet Type"}
                </button>
              </form>
            </section>
          ) : (
            <section>
              <h4>Edit Pallet Type</h4>

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
                  Select pallet type
                </label>
                <select
                  value={selectedPalletId}
                  onChange={(e) =>
                    setSelectedPalletId(
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                  style={{ width: "100%" }}
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

              <form onSubmit={handleEditSubmit}>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: "block", marginBottom: 4 }}>
                    Name / Description
                  </label>
                  <input
                    name="name"
                    type="text"
                    value={editForm.name}
                    onChange={handleEditChange}
                    style={{ width: "100%" }}
                    disabled={!selectedPalletId}
                  />
                </div>

                <button
                  type="submit"
                  disabled={editSubmitting || !selectedPalletId}
                >
                  {editSubmitting ? "Updating..." : "Update Pallet Type"}
                </button>
              </form>
            </section>
          )}
        </div>

        {/* Right: pallet type list */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
          >
            <h4>Existing Pallet Types</h4>
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
            <p>Loading pallet types...</p>
          ) : pallets.length === 0 ? (
            <p>No pallet types found.</p>
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
                      Name / Description
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
                  {pallets.map((p) => (
                    <tr key={p.id} style={{ opacity: p.active ? 1 : 0.6 }}>
                      <td
                        style={{
                          borderBottom: "1px solid #eee",
                          padding: "4px 2px",
                        }}
                      >
                        {p.name}
                      </td>

                      <td
                        style={{
                          borderBottom: "1px solid #eee",
                          padding: "4px 2px",
                        }}
                      >
                        {p.active ? "Active" : "Inactive"}
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
                        {p.active ? (
                          <button
                            type="button"
                            onClick={() => togglePalletActive(p.id, false)}
                            style={{ cursor: "pointer" }}
                          >
                            Disable
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => togglePalletActive(p.id, true)}
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

export default PalletAdminSection;
