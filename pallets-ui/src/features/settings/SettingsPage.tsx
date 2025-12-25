import { useEffect, useState } from "react";
import { API_BASE } from "../../config/api";
import { apiFetch } from "../../config/apiFetch";

type StatusResponse = {
  status: string;
  timestamp: string;
  uptimeSeconds: number;

  db: {
    status: string;
    latencyMs?: number;
  };

  puppeteer: {
    status: string;
    version?: string;
  };

  pagePool: {
    maxPoolSize: number;
    currentPoolSize: number;
    created: number;
    reused: number;
    returnedToPool: number;
    closedDestroyed: number;
  };

  responseTimeMs: number;
};

export default function SettingsPage() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setError(null);
      const res = await apiFetch(`${API_BASE}/status`);

      const json = await res.json();
      setData(json);
    } catch {
      setError("Failed to reach server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const badge = (text: string, color: string) => (
    <span
      style={{
        padding: "6px 10px",
        borderRadius: 6,
        color: "white",
        backgroundColor: color,
        fontSize: "0.9rem",
      }}
    >
      {text}
    </span>
  );

  return (
    <div>
      <h2>System Monitoring Dashboard</h2>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {data && (
        <>
          {/* GLOBAL STATUS */}
          <div style={{ marginTop: 12, marginBottom: 18 }}>
            <strong>System Status:</strong>{" "}
            {data.status === "ok"
              ? badge("Healthy", "green")
              : badge("Degraded", "orange")}
          </div>

          <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
            Updated: {new Date(data.timestamp).toLocaleTimeString()}
            <br />
            Uptime: {Math.round(data.uptimeSeconds / 60)} min
          </div>

          <hr style={{ margin: "18px 0" }} />

          {/* DATABASE */}
          <section>
            <h3>🗄 Database</h3>

            {data.db.status === "up"
              ? badge("Connected", "green")
              : badge("Disconnected", "red")}

            {data.db.latencyMs !== undefined && (
              <p>Latency: {data.db.latencyMs} ms</p>
            )}
          </section>

          <hr style={{ margin: "18px 0" }} />

          {/* PUPPETEER */}
          <section>
            <h3>🖨 PDF Engine</h3>

            {data.puppeteer.status === "running"
              ? badge("Running", "green")
              : badge("Stopped", "red")}

            <p style={{ marginTop: 10 }}>
              Version: {data.puppeteer.version ?? "Unknown"}
            </p>
          </section>

          <hr style={{ margin: "18px 0" }} />

          {/* PAGE POOL */}
          <section>
            <h3>📄 Page Pool</h3>

            <p>
              Max Pool Size: {data.pagePool.maxPoolSize}
              <br />
              Current Pool Size: {data.pagePool.currentPoolSize}
              <br />
              Created Pages: {data.pagePool.created}
              <br />
              Reused Pages: {data.pagePool.reused}
              <br />
              Returned To Pool: {data.pagePool.returnedToPool}
              <br />
              Destroyed: {data.pagePool.closedDestroyed}
            </p>
          </section>

          <hr style={{ margin: "18px 0" }} />

          <p style={{ opacity: 0.7, fontSize: "0.9rem" }}>
            Request Render Time: {data.responseTimeMs} ms
          </p>
        </>
      )}
    </div>
  );
}
