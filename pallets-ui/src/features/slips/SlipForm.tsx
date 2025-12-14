// src/features/slips/SlipForm.tsx
import React, { useEffect, useState } from "react";
import type {
  Client,
  ClientAddress,
  Clerk,
  PalletType,
} from "../../types/domain";

import SoldToSection from "./components/SoldToSection";
import ShipToSection from "./components/ShipToSection";
import SlipDetailsSection from "./components/SlipDetailsSection";
import LineItemSection from "./components/LineItemSection";
import CommentsSection from "./components/CommentsSection";

import type { SlipWithRelations } from "../../types/slipApi";

export type SlipFormProps = {
  mode: "create" | "edit";
  initialSlip?: SlipWithRelations | null;
  onSaved?: (slip: SlipWithRelations) => void; // optional callback after save
};

type UiSlipItem = {
  pallet_type_id: number | "";
  qty_ordered: string;
  qty_shipped: string;
};

const emptyItem: UiSlipItem = {
  pallet_type_id: "",
  qty_ordered: "",
  qty_shipped: "",
};

const toYMD = (iso: string) => {
  // "2025-12-14T..." -> "2025-12-14"
  if (!iso) return "";
  return iso.slice(0, 10);
};

const SlipForm: React.FC<SlipFormProps> = ({
  mode,
  initialSlip = null,
  onSaved,
}) => {
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
  const [item, setItem] = useState<UiSlipItem>(emptyItem);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const includeInactive = mode === "edit"; // important for editing old slips

  // --- Load clerks + pallet types on mount ---
  useEffect(() => {
    const controller = new AbortController();

    const fetchClerks = async () => {
      try {
        const params = new URLSearchParams();
        if (includeInactive) params.set("includeInactive", "true");

        const res = await fetch(`/api/clerks?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setClerks(data);
      } catch (err) {
        if ((err as any).name === "AbortError") return;
        console.error("Error loading clerks", err);
      }
    };

    const fetchPalletTypes = async () => {
      try {
        const params = new URLSearchParams();
        if (includeInactive) params.set("includeInactive", "true");

        const res = await fetch(`/api/pallet-types?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setPalletTypes(data);
      } catch (err) {
        if ((err as any).name === "AbortError") return;
        console.error("Error loading pallet types", err);
      }
    };

    fetchClerks();
    fetchPalletTypes();

    return () => controller.abort();
  }, [includeInactive]);

  // --- Search / load clients (all if search empty) ---
  useEffect(() => {
    const controller = new AbortController();

    const loadClients = async () => {
      try {
        const params = new URLSearchParams();
        if (clientSearch.trim()) params.set("search", clientSearch.trim());
        if (includeInactive) params.set("includeInactive", "true");

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
  }, [clientSearch, includeInactive]);

  // --- Load addresses when client is selected ---
  useEffect(() => {
    const controller = new AbortController();

    const fetchAddresses = async () => {
      if (!selectedClientId) {
        setAddresses([]);
        setSelectedAddressId("");
        return;
      }

      try {
        const params = new URLSearchParams();
        if (includeInactive) params.set("includeInactive", "true");

        const res = await fetch(
          `/api/clients/${selectedClientId}/addresses?${params.toString()}`,
          { signal: controller.signal }
        );

        const data = await res.json();
        setAddresses(data);

        if (mode === "create") {
          setSelectedAddressId("");
        } else if (mode === "edit" && initialSlip) {
          setSelectedAddressId(initialSlip.ship_to_address_id);
        }
      } catch (err) {
        if ((err as any).name === "AbortError") return;
        console.error("Error loading addresses", err);
      }
    };

    fetchAddresses();
    return () => controller.abort();
  }, [selectedClientId, includeInactive]);


  // --- Prefill form in edit mode ---
  useEffect(() => {
    if (mode !== "edit") return;
    if (!initialSlip) return;

    setMessage(null);
    setError(null);

    setSelectedClientId(initialSlip.client_id);
    setSelectedAddressId(initialSlip.ship_to_address_id);
    setSelectedClerkId(initialSlip.clerk_id);

    setDate(toYMD(initialSlip.date));
    setCustomerOrder(initialSlip.customer_order);

    setDateShipped(initialSlip.date_shipped ? toYMD(initialSlip.date_shipped) : "");
    setShippedVia(initialSlip.shipped_via);

    setComments1(initialSlip.comments_line1 ?? "");
    setComments2(initialSlip.comments_line2 ?? "");

    const first = initialSlip.items?.[0];
    if (first) {
      setItem({
        pallet_type_id: first.pallet_type_id,
        qty_ordered: first.qty_ordered ?? "",
        qty_shipped: first.qty_shipped ?? "",
      });
    } else {
      setItem(emptyItem);
    }
  }, [mode, initialSlip]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      if (!selectedAddressId) {
        setError("Please select a ship-to address.");
        return;
      }
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
            qty_ordered: String(item.qty_ordered),
            qty_shipped: String(item.qty_shipped),
          },
        ],
      };

      const url =
        mode === "edit" && initialSlip?.id
          ? `/api/slips/${initialSlip.id}`
          : "/api/slips";

      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.error ||
          `Failed to ${mode === "edit" ? "update" : "create"} slip`
        );
      } else {
        setMessage(
          mode === "edit"
            ? `Slip #${data.slip_number} updated successfully.`
            : `Slip #${data.slip_number} created successfully.`
        );
        onSaved?.(data);

        // optional: reset form after create
        if (mode === "create") {
          setSelectedClientId("");
          setSelectedAddressId("");
          setSelectedClerkId("");
          setShippedVia("BPI");
          setDate("");
          setCustomerOrder("");
          setDateShipped("");
          setComments1("");
          setComments2("");
          setItem(emptyItem);
        }
      }
    } catch (err) {
      console.error("Error submitting slip", err);
      setError(
        `Unexpected error while ${mode === "edit" ? "updating" : "creating"} slip.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 900 }}>
      {message && <div style={{ marginBottom: 8, color: "green" }}>{message}</div>}
      {error && <div style={{ marginBottom: 8, color: "red" }}>{error}</div>}

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

      {/* LineItemSection expects your old SlipItem shape.
          If your LineItemSection uses numbers, update it to accept strings too.
          For now we pass compatible fields. */}
      <LineItemSection
        item={item as any}
        setItem={setItem as any}
        palletTypes={palletTypes}
      />

      <CommentsSection
        comments1={comments1}
        setComments1={setComments1}
        comments2={comments2}
        setComments2={setComments2}
      />

      <button type="submit" disabled={submitting}>
        {submitting
          ? mode === "edit"
            ? "Updating slip..."
            : "Saving slip..."
          : mode === "edit"
            ? "Update Slip"
            : "Save Slip"}
      </button>
    </form>
  );
};

export default SlipForm;
