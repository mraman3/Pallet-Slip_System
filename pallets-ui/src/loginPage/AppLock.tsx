import { useState } from "react";
import { API_BASE } from "../config/api";


export function AppLock({ onUnlocked }: { onUnlocked: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!password.trim()) {
      setError("Password required");
      return;
    }

    try {
      const url = `${API_BASE.replace(/\/$/, "")}/unlock`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });

      if (!res.ok) {
        throw new Error("Wrong password");
      }

      // ✅ Only store token AFTER validation
      localStorage.setItem("app_token", password.trim());
      onUnlocked(); // ← important: no reload

    } catch {
      setError("Wrong password");
    }
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(0deg,rgba(82, 191, 255, 1) 0%, rgba(255, 164, 79, 1) 50%, rgba(255, 255, 255, 1) 100%)",
        color: "white",
        fontFamily: "system-ui",
        width: "100vw",
      }}
    >
      <form
        onSubmit={submit}
        style={{
          background: "#f0f0f0ff",
          padding: "2rem",
          borderRadius: 8,
          width: "20vw",
        }}
      >
        <h2 style={{ marginBottom: "1rem", display: "flex", justifyContent: "center", color: "#082530ff" }}>LOGIN</h2>

        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "93.5%",
            padding: "0.9rem",
            marginBottom: "0.75rem",
            background: "#e0e0e0",
            borderRadius: 3,
            border: "1px solid #ccc",
            color: "#082530ff", 
          }}
        />

        {error && (
          <div style={{ color: "#f87171", marginBottom: "0.75rem" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "0.6rem",
            background: "#225de6ff",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Unlock
        </button>
      </form>
    </div>
  );
}
