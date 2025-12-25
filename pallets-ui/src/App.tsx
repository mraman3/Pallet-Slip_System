import { useState, useEffect } from "react";
// Login page
import { AppLock } from "./loginPage/AppLock";

import SlipForm from "./features/slips/SlipForm";
import AdminPage from "./features/admin/AdminPage";
import SlipSearchPage from "./features/createdSlips/SlipSearchPage";


type Tab = "slip" | "admin" | "search";

function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem("app_token")
  );

  useEffect(() => {
    const handleLock = () => setToken(null);
    window.addEventListener("app:locked", handleLock);
    return () => window.removeEventListener("app:locked", handleLock);
  }, []);

  if (!token) {
    return (
      <AppLock
        onUnlocked={() => {
          setToken(localStorage.getItem("app_token"));
          window.location.reload();   // ← force proper mount
        }}
      />
    );
  }

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

        <button
          type="button"
          onClick={() => setActiveTab("search")}
          style={{
            padding: "8px 16px",
            borderRadius: 4,
            border: activeTab === "search" ? "2px solid #333" : "1px solid #ccc",
            backgroundColor: activeTab === "search" ? "#a6d2f5" : "#486882",
            cursor: "pointer",
          }}
        >
          Find / Recent Slips
        </button>
      </div>

      {/* Page content based on active tab */}
      {activeTab === "slip" && (
        <>
          <p style={{ marginBottom: "16px" }}>
            Fill in the fields below to create a new slip.
          </p>
          <SlipForm mode={"create"} />
        </>
      )}
      {activeTab === "admin" && <AdminPage />}
      {activeTab === "search" && <SlipSearchPage />}
    </div>
  );
}

export default App;
