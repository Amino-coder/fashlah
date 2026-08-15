"use client";

import { useState } from "react";
import { completeProfileSetup } from "@/lib/auth";

const CORAL = "#FF5A5F";
const NAVY = "#1B1030";

/**
 * Shown once, right after a brand-new account's first magic-link auth
 * completes — whether they got there via the top تسجيل الدخول button or
 * via احفظ نتيجتك (see app/auth/callback/page.tsx, the only place this
 * is mounted). Exactly the two fields the spec asks for, nothing else.
 */
export default function ProfileSetupModal({
  lang, onDone,
}: {
  lang: "ar" | "en";
  onDone: () => void;
}) {
  const ar = lang === "ar";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await completeProfileSetup(name, phone);
      onDone();
    } catch (e: any) {
      setError(e.message || (ar ? "صار خطأ، حاول مرة ثانية" : "Something went wrong, try again"));
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      dir={ar ? "rtl" : "ltr"}
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        background: "rgba(10, 6, 25, 0.55)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div
        className="card screen-enter"
        style={{ width: "100%", maxWidth: 400, padding: "30px 26px", textAlign: "center" }}
      >
        <h2 className="font-display" style={{ fontSize: 21, fontWeight: 800, margin: "0 0 22px", lineHeight: 1.5 }}>
          {ar ? "خل تجربتك في بقدونس أحلى 👀" : "Let's make your Bagdoonis experience better 👀"}
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 40))}
            placeholder={ar ? "اسمك" : "Your name"}
            autoFocus
            style={{
              width: "100%", padding: "13px 16px", borderRadius: 14, border: "2px solid var(--ring)",
              background: "transparent", color: "var(--ink)", fontSize: 15, outline: "none", textAlign: "center",
            }}
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value.slice(0, 20))}
            placeholder={ar ? "رقم الجوال" : "Phone number"}
            type="tel"
            inputMode="tel"
            dir="ltr"
            style={{
              width: "100%", padding: "13px 16px", borderRadius: 14, border: "2px solid var(--ring)",
              background: "transparent", color: "var(--ink)", fontSize: 15, outline: "none", textAlign: "center",
            }}
          />
        </div>

        {error && (
          <p className="font-body" style={{ fontSize: 12, color: "#E63946", fontWeight: 700, marginBottom: 12 }}>{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="font-display"
          style={{
            width: "100%", padding: 16, fontSize: 16, borderRadius: 999, border: "none", color: "#fff",
            background: `linear-gradient(135deg, ${CORAL}, ${NAVY})`,
            opacity: saving ? 0.5 : 1,
          }}
        >
          {saving ? (ar ? "..." : "...") : (ar ? "حفظ" : "Save")}
        </button>
      </div>
    </div>
  );
}
