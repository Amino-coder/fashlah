"use client";

import { X } from "lucide-react";

/** The actual iOS share glyph (square with an arrow escaping upward) —
 *  hand-drawn since lucide ships no exact match, same convention as the
 *  TikTok icon on the homepage (currentColor, viewBox, size prop). */
function ShareIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12" />
      <path d="M8 7l4-4 4 4" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  );
}

function AddToHomeIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function ConfirmAddIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

const PINK = "#FF2E93";
const PURPLE = "#7C3AED";

export default function IOSInstallModal({ lang, onClose }: { lang: "ar" | "en"; onClose: () => void }) {
  const ar = lang === "ar";
  const steps = [
    { Icon: ShareIcon, ar: "اضغط على زر المشاركة", en: "Tap the Share button" },
    { Icon: AddToHomeIcon, ar: "اختر \u201cإضافة إلى الشاشة الرئيسية\u201d", en: "Tap \u201cAdd to Home Screen\u201d" },
    { Icon: ConfirmAddIcon, ar: "اضغط \u201cإضافة\u201d", en: "Tap \u201cAdd\u201d" },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100, background: "rgba(10,7,20,0.6)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        dir={ar ? "rtl" : "ltr"}
        className="pop"
        style={{
          width: "100%", maxWidth: 420, background: "var(--card)", color: "var(--ink)",
          borderRadius: "28px 28px 0 0", padding: "10px 22px 32px",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 4px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 999, background: "var(--ring)" }} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 26 }}>📱</span>
          <button
            onClick={onClose}
            aria-label={ar ? "إغلاق" : "Close"}
            style={{ width: 32, height: 32, borderRadius: 999, background: "var(--ring)", border: "none", color: "var(--ink-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X size={16} />
          </button>
        </div>

        <h2 className="font-display" style={{ fontSize: 20, fontWeight: 800, margin: "4px 0 4px" }}>
          {ar ? "ثبّت بقدونس على جوالك" : "Install Bagdoonis on your phone"}
        </h2>
        <p className="font-body" style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: "0 0 20px", fontWeight: 600 }}>
          {ar ? "ثلاث خطوات بسيطة وبتصير جاهزة على شاشتك الرئيسية:" : "Three quick steps and it's ready on your home screen:"}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                aria-hidden="true"
                style={{
                  width: 20, height: 20, borderRadius: 999, flexShrink: 0,
                  background: `linear-gradient(135deg, ${PINK}, ${PURPLE})`, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800,
                }}
              >
                {i + 1}
              </div>
              <div
                aria-hidden="true"
                style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: "var(--ring)", color: "var(--ink)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <step.Icon size={19} />
              </div>
              <p className="font-body" style={{ fontSize: 14.5, fontWeight: 700, margin: 0 }}>
                {ar ? step.ar : step.en}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="font-display"
          style={{
            display: "block", width: "100%", marginTop: 26, padding: 15, fontSize: 14.5,
            borderRadius: 999, border: "none", color: "#fff",
            background: `linear-gradient(135deg, ${PINK}, ${PURPLE})`,
          }}
        >
          {ar ? "تمام، فهمت 👍" : "Got it 👍"}
        </button>
      </div>
    </div>
  );
}
