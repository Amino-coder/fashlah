import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "بقدونس | Bagdoonis",
  description: "اكتشفوا أسرار قروبكم 😂 — the party game for your friend group.",
  manifest: "/site.webmanifest",
  applicationName: "Bagdoonis",
  appleWebApp: { capable: true, title: "بقدونس", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

// In Next 14 themeColor/colorScheme belong on the `viewport` export, not
// `metadata` (they warn at build time otherwise). Two entries so the mobile
// browser chrome matches the actual theme instead of always being pink.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFDF7" },
    { media: "(prefers-color-scheme: dark)", color: "#140F29" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Runs before first paint, so the page never flashes the wrong theme or
// text direction while React waits for localStorage on the client. Without
// this every navigation showed a white flash before the stored prefs
// applied. Falls back to the OS colour scheme when the user hasn't picked
// one yet. Wrapped in try/catch because localStorage throws in some
// privacy modes — a failure here should degrade to defaults, not blank the
// page.
const NO_FLASH_SCRIPT = `
(function(){try{
var l=localStorage.getItem('bagdoonis_lang')||'ar';
var d=localStorage.getItem('bagdoonis_dark');
var dark=d===null?window.matchMedia('(prefers-color-scheme: dark)').matches:d==='1';
var e=document.documentElement;
e.lang=l;e.dir=l==='ar'?'rtl':'ltr';
if(dark)e.classList.add('dark');
}catch(_){}})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // lang/dir here are only the server-rendered defaults; the script above
    // corrects them before paint when the visitor has a stored preference.
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
