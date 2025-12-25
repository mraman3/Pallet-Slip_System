import { useState, useEffect } from "react";
import "./App.css";

// Login page
import { AppLock } from "./loginPage/AppLock";

import SlipForm from "./features/slips/SlipForm";
import AdminPage from "./features/admin/AdminPage";
import SlipSearchPage from "./features/createdSlips/SlipSearchPage";
import SettingsPage from "./features/settings/SettingsPage";

type Tab = "slip" | "admin" | "search" | "settings";

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("app_token"));
  const [activeTab, setActiveTab] = useState<Tab>("slip");

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
          window.location.reload(); // force proper mount
        }}
      />
    );
  }

  return (
    <div className="app-content">
      <div className="app-header">
        <h1 className="app-title">Brampton Pallet – Slip System</h1>
      </div>
      <div className="app-root">
        <div className="sidebar">
          {/* Tabs */}
          <div className="tab-bar">
            <button
              type="button"
              onClick={() => setActiveTab("slip")}
              className={`tab-button ${activeTab === "slip" ? "active" : ""}`}
            >
              Slip Entry
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("admin")}
              className={`tab-button ${activeTab === "admin" ? "active" : ""}`}
            >
              Admin / Master Data
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("search")}
              className={`tab-button ${activeTab === "search" ? "active" : ""}`}
            >
              Find / Recent Slips
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`tab-button ${activeTab === "settings" ? "active" : ""}`}
            >
              Settings
            </button>
          </div>
        </div>





        {/* Page content */}
        {activeTab === "slip" && <SlipForm mode="create" />}
        {activeTab === "admin" && <AdminPage />}
        {activeTab === "search" && <SlipSearchPage />}
        {activeTab === "settings" && <SettingsPage />}
      </div>
    </div>
  );
}

export default App;
