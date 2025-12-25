import { useEffect, useState } from "react";
import { apiFetch } from "../../config/apiFetch";

type StatusResponse = {
  status: "ok" | "degraded" | "critical";
  timestamp: string;
  uptimeSeconds: number;

  appLock: {
    enabled: boolean;
  };

  db: {
    status: "up" | "down";
    latencyMs?: number;
  };

  pdf: {
    browser: "initializing" | "ready" | "unavailable";
    pool: {
      size: number;
      max: number;
      inUse: number;
      idle: number;
    };
  };
};

export default function SettingsPage() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setError(null);
      const res = await apiFetch("/status");
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
    const interval = setInterval(fetchStatus, 5000); // refresh every 5s
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

      {loading && <p>Loading system status…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {data && (
        <>
          {/* Global System State */}
          <div style={{ marginTop: 12, marginBottom: 18 }}>
            <strong>System Status:</strong>{" "}
            {data.status === "ok" && badge("Healthy", "green")}
            {data.status === "degraded" && badge("Degraded", "orange")}
            {data.status === "critical" && badge("Critical", "red")}
          </div>

          <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
            Updated: {new Date(data.timestamp).toLocaleTimeString()}
            <br />
            Uptime: {Math.round(data.uptimeSeconds / 60)} min
          </div>

          <hr style={{ margin: "18px 0" }} />

          {/* 🔐 App Lock */}
          <section>
            <h3>🔐 Application Lock</h3>
            {data.appLock.enabled
              ? badge("Enabled", "#0077ff")
              : badge("Disabled", "gray")}
          </section>

          <hr style={{ margin: "18px 0" }} />

          {/* 🗄 Database */}
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

          {/* 🖨 PDF + Puppeteer */}
          <section>
            <h3>🖨 PDF Engine (Puppeteer)</h3>

            {data.pdf.browser === "ready" &&
              badge("Ready", "green")}

            {data.pdf.browser === "initializing" &&
              badge("Initializing", "orange")}

            {data.pdf.browser === "unavailable" &&
              badge("Unavailable", "red")}

            <p style={{ marginTop: 12 }}>
              <strong>Page Pool</strong>
              <br />
              Pool Size: {data.pdf.pool.size} / {data.pdf.pool.max}
              <br />
              In Use: {data.pdf.pool.inUse}
              <br />
              Idle: {data.pdf.pool.idle}
            </p>
          </section>
        </>
      )}
    </div>
  );
}
