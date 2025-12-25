import { useEffect, useState } from "react";
import { API_BASE } from "../../config/api"; 
import { apiFetch } from "../../config/apiFetch";

export default function SettingsPage() {
  const [raw, setRaw] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setError(null);
      const res = await apiFetch(`${API_BASE}/status`);

      // If backend returned HTML or something weird → avoid crash
      const text = await res.text();

      try {
        const json = JSON.parse(text);
        setRaw(json);
      } catch {
        setRaw(text); // if not json just show raw
      }

    } catch (err) {
      console.error(err);
      setError("Failed to reach server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div>
      <h2>System Monitoring Dashboard (Debug Mode)</h2>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <pre
        style={{
          padding: 12,
          background: "#111",
          color: "#0f0",
          borderRadius: 6,
          overflowX: "auto",
        }}
      >
        {raw ? JSON.stringify(raw, null, 2) : "No data"}
      </pre>
    </div>
  );
}
