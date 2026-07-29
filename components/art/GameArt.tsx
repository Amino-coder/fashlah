/**
 * Home-page game tiles.
 *
 * Each tile is a full-bleed colour square from the brand palette with the
 * game's own avatar component(s) placed inside, rather than bespoke
 * illustrations. Wrapping them in `.no-anim` switches off the idle float /
 * blink / sway the avatars normally run, since a grid of four looping
 * characters is distracting on a menu.
 */
import NiqabGirl from "@/components/shofah/NiqabGirl";
import ShemaghGuy from "@/components/shofah/ShemaghGuy";
import SuitGuy from "@/components/job/SuitGuy";

const PINK = "#FF2E93";
const PURPLE = "#7C3AED";
const MINT = "#2EE6A6";
const YELLOW = "#FFD400";
const INK = "#17122B";
const CREAM = "#FFFDF7";

type P = { size?: number };

function Sp({ x, y, s = 8, f = CREAM, o = 1 }: { x: number; y: number; s?: number; f?: string; o?: number }) {
  return (
    <path
      d={`M ${x} ${y - s} Q ${x + s * 0.22} ${y - s * 0.22} ${x + s} ${y} Q ${x + s * 0.22} ${y + s * 0.22} ${x} ${y + s} Q ${x - s * 0.22} ${y + s * 0.22} ${x - s} ${y} Q ${x - s * 0.22} ${y - s * 0.22} ${x} ${y - s} Z`}
      fill={f}
      opacity={o}
    />
  );
}

/** Shared frame: solid colour field + a little confetti behind the avatars. */
function Tile({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <div className="no-anim" style={{ width: "100%", height: "100%", position: "relative", background: bg, overflow: "hidden" }}>
      <svg viewBox="0 0 200 200" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden="true">
        <circle cx="26" cy="30" r="5" fill={CREAM} opacity=".5" />
        <circle cx="176" cy="40" r="4" fill={YELLOW} opacity=".85" />
        <Sp x={30} y={168} s={8} f={YELLOW} o={0.9} />
        <Sp x={172} y={166} s={7} f={CREAM} o={0.75} />
        <Sp x={100} y={22} s={6} f={CREAM} o={0.7} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        {children}
      </div>
    </div>
  );
}

/* فشلة — the whole crew */
export function FashlahArt({ size = 120 }: P) {
  return (
    <Tile bg={PINK}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", width: "100%", height: "88%" }}>
        <div style={{ width: "40%", marginInlineEnd: "-9%" }}><NiqabGirl size={size} /></div>
        <div style={{ width: "44%", zIndex: 2 }}><SuitGuy size={size} /></div>
        <div style={{ width: "40%", marginInlineStart: "-9%" }}><ShemaghGuy size={size} /></div>
      </div>
    </Tile>
  );
}

/* أبي أتزوج — مزنة و مرعي */
export function ShofahArt({ size = 120 }: P) {
  return (
    <Tile bg={PURPLE}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", width: "100%", height: "92%" }}>
        <div style={{ width: "52%", marginInlineEnd: "-5%" }}><ShemaghGuy size={size} /></div>
        <div style={{ width: "52%", marginInlineStart: "-5%" }}><NiqabGirl size={size} /></div>
      </div>
    </Tile>
  );
}

/* مين بيتوظف — the interviewer */
export function JobArt({ size = 120 }: P) {
  return (
    <Tile bg={MINT}>
      <div style={{ width: "82%", height: "94%" }}><SuitGuy size={size} /></div>
    </Tile>
  );
}

/* عبارات — the card motif (no character) */
export function IbaratArt({ size = 120 }: P) {
  return (
    <div className="no-anim" style={{ width: "100%", height: "100%", position: "relative", background: YELLOW, overflow: "hidden" }}>
      <svg viewBox="0 0 200 200" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden="true">
        <circle cx="28" cy="38" r="5" fill={PINK} />
        <circle cx="172" cy="48" r="4.5" fill={PURPLE} />
        <Sp x={168} y={162} s={8} f={CREAM} />
        <Sp x={100} y={24} s={7} f={CREAM} o={0.8} />
        <rect x="52" y="52" width="66" height="94" rx="12" fill={PURPLE} transform="rotate(-14 100 100)" />
        <rect x="62" y="50" width="66" height="94" rx="12" fill={MINT} transform="rotate(-4 100 100)" />
        <rect x="68" y="48" width="66" height="96" rx="12" fill={CREAM} transform="rotate(8 100 100)" />
        <g transform="rotate(8 100 100)">
          <Sp x={101} y={82} s={19} f={PINK} />
          <path d="M 78 116 h 46 M 86 130 h 30" stroke={INK} strokeWidth="5" strokeLinecap="round" opacity=".22" />
        </g>
      </svg>
    </div>
  );
}
