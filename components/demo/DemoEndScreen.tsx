"use client";

import Link from "next/link";
import HomeButton from "@/components/HomeButton";

export default function DemoEndScreen({
  createHref, accentFrom, accentTo,
}: {
  createHref: string;
  accentFrom: string;
  accentTo: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, marginTop: 100, textAlign: "center" }}>
      <HomeButton label="الصفحة الرئيسية" />
      <span style={{ fontSize: 56 }} className="pop">🎉</span>
      <p className="font-display" style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>
        انتهت التجربة!
      </p>
      <p className="font-body" style={{ fontSize: 15, color: "var(--ink-soft)", fontWeight: 600, maxWidth: 300, margin: 0 }}>
        الآن العب مع أصحابك وأنشئ جلسة حقيقية.
      </p>
      <Link
        href={createHref}
        className="font-display"
        style={{
          marginTop: 10, padding: "16px 40px", fontSize: 16, borderRadius: 999, border: "none",
          color: "#fff", textDecoration: "none",
          background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})`,
          boxShadow: `0 10px 26px ${accentTo}55`,
        }}
      >
        إنشاء جلسة
      </Link>
    </div>
  );
}
