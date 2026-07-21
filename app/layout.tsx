import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "بقدونس | Bagdoonis",
  description: "اكتشفوا أسرار قروبكم 😂 — the party game for your friend group.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
