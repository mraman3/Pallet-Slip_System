// src/features/admin/components/ClerkAdminSection.tsx
import React, { useEffect, useState } from "react";
import "./css/ClerkAdminSection.css"

//import api
import { API_BASE } from "../../../config/api";
import { apiFetch } from "../../../config/apiFetch";

import type { Clerk } from "../../../types/domain";

const emptyClerkForm = {
  name: "",
};

const ClerkAdminSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"add" | "edit">("add");

  const [search, setSearch] = useState("");
  const [clerks, setClerks] = useState<Clerk[]>([]);
  const [loading, setLoading] = useState(false);
  const [showInactive, setShowInactive] = useState(false);


  // add form
  const [addForm, setAddForm] = useState(emptyClerkForm);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addMessage, setAddMessage] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  // edit form
  const [selectedClerkId, setSelectedClerkId] = useState<number | "">("");
  const [editForm, setEditForm] = useState(emptyClerkForm);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editMessage, setEditMessage] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // ---- load / search clerks ----
  const fetchClerks = async (
    searchValue: string,
    includeInactive: boolean,
    signal?: AbortSignal
  ) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (searchValue.trim()) params.set("search", searchValue.trim());
      if (includeInactive) params.set("includeInactive", "true");

      const res = await apiFetch(`${API_BASE}/clerks?${params.toString()}`, { signal });
      const data: Clerk[] = await res.json();
      setClerks(data);
    } catch (err) {
      if ((err as any).name === "AbortError") return;
      console.error("Error loading clerks", err);
    } finally {
      setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    const controller = new AbortController();
    fetchClerks("", false, controller.signal);
    return () => controller.abort();
  }, []);

  // debounce search
  useEffect(() => {
    const controller = new AbortController();

    const t = setTimeout(() => {
      fetchClerks(search, showInactive, controller.signal);
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [search, showInactive]);

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
        setAddError("Clerk name is required.");
        setAddSubmitting(false);
        return;
      }

      const res = await apiFetch(`${API_BASE}/clerks`, {
        method: "POST",
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAddError(data.error || "Failed to create clerk.");
      } else {
        setAddMessage(`Clerk "${data.name}" created.`);
        setAddForm(emptyClerkForm);
        void fetchClerks(search, showInactive);
      }
    } catch (err) {
      console.error("Error creating clerk", err);
      setAddError("Unexpected error creating clerk.");
    } finally {
      setAddSubmitting(false);
    }
  };

  // ---- edit handlers ----
  useEffect(() => {
    if (!selectedClerkId) {
      setEditForm(emptyClerkForm);
      return;
    }
    const found = clerks.find((c) => c.id === selectedClerkId);
    if (found) {
      setEditForm({ name: found.name });
    }
  }, [selectedClerkId, clerks]);

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
      if (!selectedClerkId) {
        setEditError("Please select a clerk to edit.");
        setEditSubmitting(false);
        return;
      }

      const { name } = editForm;

      if (!name.trim()) {
        setEditError("Clerk name is required.");
        setEditSubmitting(false);
        return;
      }

      const res = await apiFetch(`${API_BASE}/clerks/${selectedClerkId}`, {
        method: "PUT",
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEditError(data.error || "Failed to update clerk.");
      } else {
        setEditMessage(`Clerk "${data.name}" updated.`);
        void fetchClerks(search, showInactive);
      }
    } catch (err) {
      console.error("Error updating clerk", err);
      setEditError("Unexpected error updating clerk.");
    } finally {
      setEditSubmitting(false);
    }
  };

  // ---- Active handlers ----
  const toggleClerkActive = async (clerkId: number, makeActive: boolean) => {
    try {
      const res = await apiFetch(
        `${API_BASE}/clerks/${clerkId}/${makeActive ? "enable" : "disable"}`,
        { method: "PATCH" }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to update clerk status.");
        return;
      }

      // refresh list (keeps your search + showInactive filter)
      await fetchClerks(search, showInactive);
    } catch (err) {
      console.error("Error toggling clerk active", err);
      alert("Unexpected error updating clerk status.");
    }
  };

  return (
    <fieldset className="clerk-section">
      <legend>Clerks</legend>

      <div className="clerk-admin">
        <header className="clerk-admin-header">
          <p>Manage the list of clerks that can be assigned to slips.</p>
        </header>

        <div className="clerk-admin-layout">
          {/* Left: tabs + forms */}
          <div className="clerk-admin-main">
            {/* Tabs */}
            <div className="admin-tabs clerk-admin-tabs">
              <button
                type="button"
                onClick={() => setActiveTab("add")}
                className={activeTab === "add" ? "active" : ""}
              >
                Add Clerk
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("edit")}
                className={activeTab === "edit" ? "active" : ""}
              >
                Edit Clerk
              </button>
            </div>

            {/* Search */}
            <div className="field">
              <label>Search clerks</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type clerk name..."
              />
            </div>

            {activeTab === "add" ? (
              <section className="admin-form">
                <h4>Add Clerk</h4>

                {addMessage && <div className="status success">{addMessage}</div>}
                {addError && <div className="status error">{addError}</div>}

                <form onSubmit={handleAddSubmit} className="admin-form">
                  <div className="field">
                    <label>Clerk Name</label>
                    <input
                      name="name"
                      type="text"
                      value={addForm.name}
                      onChange={handleAddChange}
                      placeholder="e.g. John Smith"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={addSubmitting}
                    className="add-admin-button"
                  >
                    {addSubmitting ? "Saving..." : "Add Clerk"}
                  </button>
                </form>
              </section>
            ) : (
              <section className="admin-form">
                <h4>Edit Clerk</h4>

                {editMessage && <div className="status success">{editMessage}</div>}
                {editError && <div className="status error">{editError}</div>}

                <div className="field">
                  <label>Select clerk</label>
                  <select
                    value={selectedClerkId}
                    onChange={(e) =>
                      setSelectedClerkId(
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                  >
                    <option value="">-- Select --</option>
                    {clerks.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.active === false ? " (inactive)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <form onSubmit={handleEditSubmit} className="admin-form">
                  <div className="field">
                    <label>Clerk Name</label>
                    <input
                      name="name"
                      type="text"
                      value={editForm.name}
                      onChange={handleEditChange}
                      disabled={!selectedClerkId}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={editSubmitting || !selectedClerkId}
                    className="update-admin-button"
                  >
                    {editSubmitting ? "Updating..." : "Update Clerk"}
                  </button>
                </form>
              </section>
            )}
          </div>

          {/* Right: clerk list */}
          <aside className="clerk-admin-sidebar">
            <div className="clerk-admin-sidebar-header">
              <h4>Existing Clerks</h4>
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
              <p>Loading clerks...</p>
            ) : clerks.length === 0 ? (
              <p>No clerks found.</p>
            ) : (
              <div className="clerk-table-wrapper">
                <table className="admin-table clerk-admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Status</th>
                      <th className="actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clerks.map((c) => (
                      <tr
                        key={c.id}
                        className={!c.active ? "inactive" : undefined}
                      >
                        <td>{c.name}</td>
                        <td>{c.active ? "Active" : "Inactive"}</td>
                        <td className="actions">
                          {c.active ? (
                            <button
                              type="button"
                              onClick={() => toggleClerkActive(c.id, false)}
                            >
                              Disable
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleClerkActive(c.id, true)}
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
          </aside>
        </div>
      </div>
    </fieldset>
  );
};

export default ClerkAdminSection;
