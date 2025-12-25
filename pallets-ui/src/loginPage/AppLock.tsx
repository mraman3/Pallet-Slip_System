import { useState } from "react";
import { API_BASE } from "../config/api";
import "./AppLock.css";

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
      onUnlocked(); // no reload

    } catch {
      setError("Wrong password");
    }
  }

  return (
    <div className="app-lock-container">
      <form className="app-lock-form" onSubmit={submit}>
        <h2 className="app-lock-title">LOGIN</h2>

        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="app-lock-input"
        />

        {error && (
          <div className="app-lock-error">
            {error}
          </div>
        )}

        <button type="submit" className="app-lock-button">
          Unlock
        </button>
      </form>
    </div>
  );
}
