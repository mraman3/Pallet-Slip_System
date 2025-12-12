// src/features/admin/components/ClerkAdminSection.tsx
import React, { useEffect, useState } from "react";
import type { Clerk } from "../../../types/domain";

const emptyClerkForm = {
  name: "",
};

const ClerkAdminSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"add" | "edit">("add");

  const [search, setSearch] = useState("");
  const [clerks, setClerks] = useState<Clerk[]>([]);
  const [loading, setLoading] = useState(false);

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
  const fetchClerks = async (searchValue: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchValue.trim()) {
        params.set("search", searchValue.trim());
      }
      const res = await fetch(`/api/clerks?${params.toString()}`);
      const data: Clerk[] = await res.json();
      setClerks(data);
    } catch (err) {
      console.error("Error loading clerks", err);
    } finally {
      setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    void fetchClerks("");
  }, []);

  // debounce search
  useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      try {
        const params = new URLSearchParams();
        if (search.trim()) {
          params.set("search", search.trim());
        }
        const res = await fetch(`/api/clerks?${params.toString()}`, {
          signal: controller.signal,
        });
        const data: Clerk[] = await res.json();
        setClerks(data);
      } catch (err) {
        if ((err as any).name === "AbortError") return;
        console.error("Error searching clerks", err);
      }
    };

    const timeout = setTimeout(run, 300);
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [search]);

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

      const res = await fetch("/api/clerks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAddError(data.error || "Failed to create clerk.");
      } else {
        setAddMessage(`Clerk "${data.name}" created.`);
        setAddForm(emptyClerkForm);
        void fetchClerks(search);
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

      const res = await fetch(`/api/clerks/${selectedClerkId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEditError(data.error || "Failed to update clerk.");
      } else {
        setEditMessage(`Clerk "${data.name}" updated.`);
        void fetchClerks(search);
      }
    } catch (err) {
      console.error("Error updating clerk", err);
      setEditError("Unexpected error updating clerk.");
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div>
      <h3 style={{ marginBottom: 0}}>Clerks</h3>
      <p style={{ marginBottom: 15, marginTop: 0}}>
        Manage the list of clerks that can be assigned to slips.
      </p>

      {/* Search field */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 4 }}>
          Search clerks
        </label>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Type clerk name..."
          style={{ width: "100%" }}
        />
      </div>

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
              Add Clerk
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
              Edit Clerk
            </button>
          </div>

          {activeTab === "add" ? (
            <section>
              <h4>Add Clerk</h4>

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
                    Clerk Name
                  </label>
                  <input
                    name="name"
                    type="text"
                    value={addForm.name}
                    onChange={handleAddChange}
                    style={{ width: "100%" }}
                    placeholder="e.g. John Smith"
                  />
                </div>

                <button type="submit" disabled={addSubmitting}>
                  {addSubmitting ? "Saving..." : "Add Clerk"}
                </button>
              </form>
            </section>
          ) : (
            <section>
              <h4>Edit Clerk</h4>

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
                  Select clerk
                </label>
                <select
                  value={selectedClerkId}
                  onChange={(e) =>
                    setSelectedClerkId(
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                  style={{ width: "100%" }}
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

              <form onSubmit={handleEditSubmit}>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: "block", marginBottom: 4 }}>
                    Clerk Name
                  </label>
                  <input
                    name="name"
                    type="text"
                    value={editForm.name}
                    onChange={handleEditChange}
                    style={{ width: "100%" }}
                    disabled={!selectedClerkId}
                  />
                </div>

                <button
                  type="submit"
                  disabled={editSubmitting || !selectedClerkId}
                >
                  {editSubmitting ? "Updating..." : "Update Clerk"}
                </button>
              </form>
            </section>
          )}
        </div>

        {/* Right: clerk list */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <h4>Existing Clerks</h4>

          {loading ? (
            <p>Loading clerks...</p>
          ) : clerks.length === 0 ? (
            <p>No clerks found.</p>
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
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clerks.map((c) => (
                    <tr key={c.id}>
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
                        {c.active === false ? "Inactive" : "Active"}
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

export default ClerkAdminSection;
