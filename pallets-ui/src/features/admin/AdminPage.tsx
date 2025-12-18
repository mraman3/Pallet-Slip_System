import React from "react";
import ClientAdminSection from "./components/ClientAdminSection";
import AddressAdminSection from "./components/AddressAdminSection";
import PalletAdminSection from "./components/PalletAdminSection";
import ClerkAdminSection from "./components/ClerkAdminSection";

const AdminPage: React.FC = () => {
  const [clientVersion, setClientVersion] = React.useState(0);

  const refreshClientsEverywhere = () => {
    setClientVersion((v) => v + 1);
  };

  return (
    <div>
      <h2>Admin – Master Data</h2>

      <section>
        <ClientAdminSection onClientChanged={refreshClientsEverywhere} />
      </section>

      <section>
        <AddressAdminSection clientVersion={clientVersion} />
      </section>

      <section>
        <PalletAdminSection />
      </section>

      <section>
        <ClerkAdminSection />
      </section>
    </div>
  );
};


export default AdminPage;

