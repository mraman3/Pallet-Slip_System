import { useEffect, useState } from "react";

//import api
import { API_BASE } from "../../../config/api";

import type { Client, ClientAddress } from "../../../types/domain";

/**
 * Arguments required by useClientLookup
 *
 * - clientSearch: text used to search clients
 * - addressSearch: text used to search addresses
 * - selectedClientId: currently selected client (drives address lookup)
 */
interface Args {
  clientSearch: string;
  addressSearch: string;
  selectedClientId: number | "";
}

/**
 * useClientLookup
 *
 * Responsibilities:
 * - Fetch and debounce client search results
 * - Fetch and debounce address search results scoped to a selected client
 * - Include inactive clients/addresses for historical data
 *
 * This hook:
 * - Does NOT own selected client/address state
 * - Does NOT mutate parent state
 * - Only concerns itself with lookup data
 */
export const useClientLookup = ({
  clientSearch,
  addressSearch,
  selectedClientId,
}: Args) => {
  // -------------------------
  // STATE
  // -------------------------
  const [clientResults, setClientResults] = useState<Client[]>([]);
  const [addressResults, setAddressResults] = useState<ClientAddress[]>([]);

  // -------------------------
  // CLIENT LOOKUP (DEBOUNCED)
  // -------------------------
  /**
   * Fetch clients matching the search input.
   * Debounced to avoid spamming the API while typing.
   */
  useEffect(() => {
    const controller = new AbortController();

    const fetchClients = async () => {
      try {
        const params = new URLSearchParams();

        if (clientSearch.trim()) {
          params.set("search", clientSearch.trim());
        }

        // Include inactive clients for historical slips
        params.set("includeInactive", "true");

        const res = await fetch(`${API_BASE}/clients?${params.toString()}`, {
          signal: controller.signal,
        });

        const data = await res.json();
        setClientResults(data);
      } catch (e: any) {
        // Abort is expected when typing quickly
        if (e.name === "AbortError") return;
        console.error("Error loading clients", e);
      }
    };

    // Debounce input by 300ms
    const timeout = setTimeout(fetchClients, 300);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [clientSearch]);

  // -------------------------
  // ADDRESS LOOKUP (DEBOUNCED)
  // -------------------------
  /**
   * Fetch addresses for the selected client.
   * Automatically clears results when no client is selected.
   */
  useEffect(() => {
    if (!selectedClientId) {
      setAddressResults([]);
      return;
    }

    const controller = new AbortController();

    const fetchAddresses = async () => {
      try {
        const params = new URLSearchParams();

        if (addressSearch.trim()) {
          params.set("search", addressSearch.trim());
        }

        // Include inactive addresses for historical slips
        params.set("includeInactive", "true");

        const res = await fetch(
          `${API_BASE}/clients/${selectedClientId}/addresses?${params.toString()}`,
          { signal: controller.signal }
        );

        const data = await res.json();
        setAddressResults(data);
      } catch (e: any) {
        // Abort is expected when typing or switching clients
        if (e.name === "AbortError") return;
        console.error("Error loading addresses", e);
      }
    };

    // Debounce input by 300ms
    const timeout = setTimeout(fetchAddresses, 300);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [selectedClientId, addressSearch]);

  // -------------------------
  // PUBLIC API
  // -------------------------
  return {
    clientResults,
    addressResults,
  };
};
