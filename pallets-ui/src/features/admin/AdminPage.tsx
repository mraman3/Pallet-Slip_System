import React from "react";
import ClientAdminSection from "./components/ClientAdminSection";
import AddressAdminSection from "./components/AddressAdminSection";
import PalletAdminSection from "./components/PalletAdminSection";
import ClerkAdminSection from "./components/ClerkAdminSection";

/**
 * AdminPage
 *
 * Responsibilities:
 * - High-level layout for master data management
 * - Coordinate refresh between client + address sections
 *
 * Non-responsibilities:
 * - CRUD logic
 * - Validation
 * - Styling of child admin components
 */
const AdminPage: React.FC = () => {
  const [clientVersion, setClientVersion] = React.useState(0);

  /**
   * Forces dependent components to refresh client data.
   * Used after creating/updating clients.
   */
  const refreshClientsEverywhere = () => {
    setClientVersion((v) => v + 1);
  };

  return (
    <div className="admin-page">
      <h2>Admin – Master Data</h2>

      <section className="admin-section">
        <ClientAdminSection onClientChanged={refreshClientsEverywhere} />
      </section>
      
      <section className="admin-section">
        <AddressAdminSection clientVersion={clientVersion} />
      </section>

      <section className="admin-section">
        <PalletAdminSection />
      </section>

      <section className="admin-section">
        <ClerkAdminSection />
      </section>
    </div>
  );
};


export default AdminPage;

