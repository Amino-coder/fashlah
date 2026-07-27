/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // `/create`, `/join` and `/session/[code]` were the original pre-namespace
  // Fashlah routes. Once the game moved under `/fashlah/*` they were left
  // behind as near-identical copies — still publicly reachable, still
  // handing out share links pointing back at themselves, and with their
  // "back" button going to the platform home instead of the game.
  //
  // They're redirected rather than just deleted because invite links from
  // old sessions (WhatsApp messages people already sent) point at
  // `/join?code=XXXX`, and those should keep working. Query strings are
  // preserved automatically, so the code carries across.
  async redirects() {
    return [
      { source: "/create", destination: "/fashlah/create", permanent: true },
      { source: "/join", destination: "/fashlah/join", permanent: true },
      { source: "/session/:code", destination: "/fashlah/session/:code", permanent: true },
    ];
  },
};

module.exports = nextConfig;
