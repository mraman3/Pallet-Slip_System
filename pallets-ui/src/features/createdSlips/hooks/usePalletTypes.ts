import { useEffect, useState } from "react";
import type { PalletType } from "../../../types/domain";

/**
 * usePalletTypes
 *
 * Responsibilities:
 * - Fetch pallet types from the API on mount
 * - Include inactive pallet types for admin/search views
 * - Expose loading and error state for optional UI feedback
 *
 * This hook is intentionally simple:
 * - No parameters
 * - Fetches once on mount
 * - Centralizes pallet-type lookup logic
 */
export const usePalletTypes = () => {
  // -------------------------
  // STATE
  // -------------------------
  const [palletTypes, setPalletTypes] = useState<PalletType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------------
  // SIDE EFFECTS
  // -------------------------
  /**
   * Load pallet types when the hook is first used.
   * Inactive pallet types are included so they can still
   * appear in dropdowns and historical records.
   */
  useEffect(() => {
    const fetchPalletTypes = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.set("includeInactive", "true");

        const res = await fetch(`/api/pallet-types?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load pallet types");
        }

        setPalletTypes(data);
      } catch (e: any) {
        console.error("Error loading pallet types", e);
        setError(e.message || "Unexpected error loading pallet types");
      } finally {
        setLoading(false);
      }
    };

    fetchPalletTypes();
  }, []);

  // -------------------------
  // PUBLIC API
  // -------------------------
  return {
    palletTypes,
    loading,
    error,
  };
};
