/**
 * Mirrors ihj_normalize() in ihj_schema.sql exactly, for instant
 * client-side feedback only (e.g. a subtle "starts with the right
 * letter?" hint while typing) — the actual scoring always runs through
 * the server-side SQL function, never this. If these two ever drift out
 * of sync, the SQL version is the one that counts.
 */
export function ihjNormalize(input: string): string {
  if (!input) return "";
  let result = input.trim();
  result = result.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "");
  result = result.replace(/[أإآٱ]/g, "ا");
  result = result.replace(/ـ/g, "");
  result = result.replace(/[^ابتثجحخدذرزسشصضطظعغفقكلمنهوىيءئؤةa-zA-Z0-9 ]/g, "");
  result = result.replace(/\s+/g, " ");
  return result.trim();
}
