"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminSetupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      router.push("/admin/login");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0F0B1A", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 380, background: "#1B1030", borderRadius: 20, padding: 32, color: "#fff" }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 6px" }}>Set up the first admin account</h1>
        <p style={{ fontSize: 13, opacity: 0.65, margin: "0 0 24px" }}>
          This only works once — if an admin already exists, use /admin/login instead.
        </p>

        <label style={{ display: "block", fontSize: 12, opacity: 0.75, marginBottom: 6 }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.06)", color: "#fff", marginBottom: 16, outline: "none" }}
        />

        <label style={{ display: "block", fontSize: 12, opacity: 0.75, marginBottom: 6 }}>Password (min 8 characters)</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.06)", color: "#fff", marginBottom: 20, outline: "none" }}
        />

        {error && <p style={{ color: "#FF6B6B", fontSize: 13, marginBottom: 16 }}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading || !email || password.length < 8}
          style={{
            width: "100%", padding: 13, borderRadius: 10, border: "none", fontWeight: 700, fontSize: 14,
            background: "#FF5A5F", color: "#fff", opacity: loading || !email || password.length < 8 ? 0.5 : 1,
          }}
        >
          {loading ? "Creating..." : "Create admin account"}
        </button>
      </div>
    </div>
  );
}
