import React, { useState } from "react";
import SlipForm from "./features/slips/SlipForm";
import AdminPage from "./features/admin/AdminPage";

type Tab = "slip" | "admin";

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("slip");

  return (
    <div style={{ padding: "24px", fontFamily: "sans-serif" }}>
      <h1>Brampton Pallet – Slip System</h1>

      {/* Tabs */}
      <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => setActiveTab("slip")}
          style={{
            padding: "8px 16px",
            borderRadius: 4,
            border: activeTab === "slip" ? "2px solid #333" : "1px solid #ccc",
            backgroundColor: activeTab === "slip" ? "#a6d2f5" : "#486882",
            cursor: "pointer",
          }}
        >
          Slip Entry
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("admin")}
          style={{
            padding: "8px 16px",
            borderRadius: 4,
            border: activeTab === "admin" ? "2px solid #333" : "1px solid #ccc",
            backgroundColor: activeTab === "admin" ? "#a6d2f5" : "#486882",
            cursor: "pointer",
          }}
        >
          Admin / Master Data
        </button>
      </div>

      {/* Page content based on active tab */}
      {activeTab === "slip" ? (
        <>
          <p style={{ marginBottom: "16px" }}>
            Fill in the fields below to create a new slip.
          </p>
          <SlipForm />
        </>
      ) : (
        <AdminPage />
      )}
    </div>
  );
}

export default App;
