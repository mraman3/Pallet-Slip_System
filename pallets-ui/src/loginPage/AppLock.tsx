import { useState } from "react";

export function AppLock() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!password.trim()) {
      setError("Password required");
      return;
    }

    // store password locally
    localStorage.setItem("app_token", password.trim());

    // reload app so it re-checks access
    window.location.reload();
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        color: "white",
        fontFamily: "system-ui",
      }}
    >
      <form
        onSubmit={submit}
        style={{
          background: "#020617",
          padding: "2rem",
          borderRadius: 8,
          width: 320,
        }}
      >
        <h2 style={{ marginBottom: "1rem" }}>🔒 App Locked</h2>

        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "0.6rem",
            marginBottom: "0.75rem",
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
            background: "#2563eb",
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
