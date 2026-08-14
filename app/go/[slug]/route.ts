import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// This is the one URL that ever gets printed on a QR code — it never
// changes. What it redirects TO is looked up fresh on every scan from
// qr_redirects, so the destination can be repointed anytime (a homepage
// launch today, a specific game next month, a campaign landing page
// after that) with a single SQL update and zero reprinting.
//
// Every scan is also logged to qr_scans (slug, destination, user agent,
// timestamp) — see supabase/qr_scans_schema.sql and qr_scan_log.sql for
// the admin query. Logging is awaited (not fire-and-forget) because
// serverless function instances can be torn down the moment a response
// is returned, which would silently drop an un-awaited insert before it
// ever reaches Supabase — a few extra milliseconds before redirecting is
// worth not losing scan data.
//
// Always redirects somewhere rather than ever showing an error — nobody
// scanning a QR code at an event should hit a broken page. Unknown slugs
// and any lookup/logging failure both fall back to the homepage.
//
// 307 (temporary redirect), not 301/308, and explicitly uncached: the
// whole point of this route is that the destination can change, so
// neither browsers nor any CDN in front of this should be allowed to
// remember an old target.

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const homepage = new URL("/", req.url);

  try {
    const { data } = await supabase
      .from("qr_redirects")
      .select("destination")
      .eq("slug", params.slug)
      .maybeSingle();

    const destination = data?.destination;
    if (!destination) {
      return NextResponse.redirect(homepage, { status: 307, headers: { "Cache-Control": "no-store" } });
    }

    await supabase.from("qr_scans").insert({
      slug: params.slug,
      destination,
      user_agent: req.headers.get("user-agent"),
    });

    const target = destination.startsWith("http") ? destination : new URL(destination, req.url).toString();
    return NextResponse.redirect(target, { status: 307, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.redirect(homepage, { status: 307, headers: { "Cache-Control": "no-store" } });
  }
}
