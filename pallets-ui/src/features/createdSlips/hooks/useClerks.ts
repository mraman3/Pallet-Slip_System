import { useEffect, useState } from "react";
import type { Clerk } from "../../../types/domain";

/**
 * useClerks
 *
 * Responsibilities:
 * - Fetch clerks from the API on mount
 * - Include inactive clerks for historical slips and admin views
 * - Expose loading and error state for optional UI feedback
 *
 * This hook is intentionally simple:
 * - No parameters
 * - Fetches once on mount
 * - Centralizes clerk lookup logic
 */
export const useClerks = () => {
  // -------------------------
  // STATE
  // -------------------------
  const [clerks, setClerks] = useState<Clerk[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------------
  // SIDE EFFECTS
  // -------------------------
  /**
   * Load clerks when the hook is first used.
   * Inactive clerks are included so historical records
   * can still display the original clerk.
   */
  useEffect(() => {
    const fetchClerks = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.set("includeInactive", "true");

        const res = await fetch(`/api/clerks?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load clerks");
        }

        setClerks(data);
      } catch (e: any) {
        console.error("Error loading clerks", e);
        setError(e.message || "Unexpected error loading clerks");
      } finally {
        setLoading(false);
      }
    };

    fetchClerks();
  }, []);

  // -------------------------
  // PUBLIC API
  // -------------------------
  return {
    clerks,
    loading,
    error,
  };
};
