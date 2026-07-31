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

export const viewport: Viewport = {
  themeColor: "#140F29",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Runs before first paint, so the page never flashes the wrong theme or
// text direction while React waits for localStorage on the client. Without
// this every navigation showed a white flash before the stored prefs
// applied. Dark is the default for anyone who hasn't explicitly picked a
// theme yet — no longer tied to the OS colour scheme, since dark mode is
// the intended first-visit experience regardless of device setting.
// Wrapped in try/catch because localStorage throws in some privacy modes —
// a failure here should degrade to the (dark) default, not blank the page.
const NO_FLASH_SCRIPT = `
(function(){try{
var l=localStorage.getItem('bagdoonis_lang')||'ar';
var d=localStorage.getItem('bagdoonis_dark');
var dark=d===null?true:d==='1';
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
