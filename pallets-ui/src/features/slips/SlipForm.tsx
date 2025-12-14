// src/features/slips/SlipForm.tsx
import React, { useEffect, useState } from "react";
import type {
  Client,
  ClientAddress,
  Clerk,
  PalletType,
  SlipItem,
} from "../../types/domain";

import SoldToSection from "./components/SoldToSection";
import ShipToSection from "./components/ShipToSection";
import SlipDetailsSection from "./components/SlipDetailsSection";
import LineItemSection from "./components/LineItemSection";
import CommentsSection from "./components/CommentsSection";

const SlipForm: React.FC = () => {
  // dropdown data
  const [clerks, setClerks] = useState<Clerk[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [clientResults, setClientResults] = useState<Client[]>([]);
  const [addresses, setAddresses] = useState<ClientAddress[]>([]);
  const [palletTypes, setPalletTypes] = useState<PalletType[]>([]);

  // selected values
  const [selectedClientId, setSelectedClientId] = useState<number | "">("");
  const [selectedAddressId, setSelectedAddressId] = useState<number | "">("");
  const [selectedClerkId, setSelectedClerkId] = useState<number | "">("");
  const [shippedVia, setShippedVia] = useState<"BPI" | "P/U">("BPI");

  // core fields
  const [date, setDate] = useState("");
  const [customerOrder, setCustomerOrder] = useState("");
  const [dateShipped, setDateShipped] = useState("");
  const [comments1, setComments1] = useState("");
  const [comments2, setComments2] = useState("");

  // single line item for now
  const [item, setItem] = useState<SlipItem>({
    pallet_type_id: "",
    qty_ordered: 0,
    qty_shipped: 0,
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Load clerks + pallet types on mount ---
  useEffect(() => {
    const fetchClerks = async () => {
      try {
        const res = await fetch("/api/clerks");
        const data = await res.json();
        setClerks(data);
      } catch (err) {
        console.error("Error loading clerks", err);
      }
    };

    const fetchPalletTypes = async () => {
      try {
        const res = await fetch("/api/pallet-types");
        const data = await res.json();
        setPalletTypes(data);
      } catch (err) {
        console.error("Error loading pallet types", err);
      }
    };

    fetchClerks();
    fetchPalletTypes();
  }, []);

  // --- Search / load clients (all if search empty) ---
  useEffect(() => {
    const controller = new AbortController();

    const loadClients = async () => {
      try {
        const params = new URLSearchParams();
        if (clientSearch.trim()) {
          params.set("search", clientSearch.trim());
        }

        const res = await fetch(`/api/clients?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setClientResults(data);
      } catch (err) {
        if ((err as any).name === "AbortError") return;
        console.error("Error loading clients", err);
      }
    };

    const timeout = setTimeout(loadClients, 300);
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [clientSearch]);

  // --- Load addresses when client is selected ---
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!selectedClientId) {
        setAddresses([]);
        setSelectedAddressId("");
        return;
      }

      try {
        const res = await fetch(`/api/clients/${selectedClientId}/addresses`);
        const data = await res.json();
        setAddresses(data);
        if (data.length === 1) {
          setSelectedAddressId(data[0].id);
        }
      } catch (err) {
        console.error("Error loading addresses", err);
      }
    };

    fetchAddresses();
  }, [selectedClientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      if (
        !selectedClientId ||
        !selectedAddressId ||
        !selectedClerkId ||
        !date ||
        !customerOrder ||
        !item.pallet_type_id ||
        !item.qty_ordered ||
        !item.qty_shipped
      ) {
        setError("Please fill in all required fields.");
        setSubmitting(false);
        return;
      }

      const body = {
        client_id: selectedClientId,
        ship_to_address_id: selectedAddressId,
        clerk_id: selectedClerkId,
        date,
        customer_order: customerOrder,
        date_shipped: dateShipped || null,
        shipped_via: shippedVia,
        comments_line1: comments1 || null,
        comments_line2: comments2 || null,
        items: [
          {
            pallet_type_id: item.pallet_type_id,
            qty_ordered: item.qty_ordered,
            qty_shipped: item.qty_shipped,
          },
        ],
      };

      const res = await fetch("/api/slips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create slip");
      } else {
        setMessage(`Slip #${data.slip_number} created successfully.`);
      }
    } catch (err) {
      console.error("Error submitting slip", err);
      setError("Unexpected error while creating slip.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 900 }}>
      {/* Status messages */}
      {message && (
        <div style={{ marginBottom: 8, color: "green" }}>{message}</div>
      )}
      {error && (
        <div style={{ marginBottom: 8, color: "red" }}>{error}</div>
      )}

      <SoldToSection
        clientSearch={clientSearch}
        setClientSearch={setClientSearch}
        clients={clientResults}
        selectedClientId={selectedClientId}
        setSelectedClientId={setSelectedClientId}
      />

      <ShipToSection
        addresses={addresses}
        selectedAddressId={selectedAddressId}
        setSelectedAddressId={setSelectedAddressId}
        clientSelected={!!selectedClientId}
      />

      <SlipDetailsSection
        date={date}
        setDate={setDate}
        customerOrder={customerOrder}
        setCustomerOrder={setCustomerOrder}
        dateShipped={dateShipped}
        setDateShipped={setDateShipped}
        clerks={clerks}
        selectedClerkId={selectedClerkId}
        setSelectedClerkId={setSelectedClerkId}
        shippedVia={shippedVia}
        setShippedVia={setShippedVia}
      />

      <LineItemSection
        item={item}
        setItem={setItem}
        palletTypes={palletTypes}
      />

      <CommentsSection
        comments1={comments1}
        setComments1={setComments1}
        comments2={comments2}
        setComments2={setComments2}
      />

      <button type="submit" disabled={submitting}>
        {submitting ? "Saving slip..." : "Save Slip"}
      </button>
    </form>
  );
};

export default SlipForm;
