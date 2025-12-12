import React from "react";
import ClientAdminSection from "./components/ClientAdminSection";
import AddressAdminSection from "./components/AddressAdminSection";
import PalletAdminSection from "./components/PalletAdminSection";
import ClerkAdminSection from "./components/ClerkAdminSection";

const AdminPage: React.FC = () => {
  return (
    <div>
      <h2 style={{ marginBottom: 0 }}>Admin – Master Data</h2>
      <p style={{ marginBottom: 65, marginTop: 0}}>
        Manage clients, ship-to locations, clerks, and pallet types.
      </p>

      <section style={{ marginBottom: 50 }}>
        <ClientAdminSection />
      </section>

      <section style={{ marginBottom: 50 }}>
        <AddressAdminSection />
      </section>
	  
      <section style={{ marginBottom: 50 }}>
        <PalletAdminSection />
      </section>
	  
	  <section>
        <ClerkAdminSection />
      </section>
		
	</div>
  );
};

export default AdminPage;

     