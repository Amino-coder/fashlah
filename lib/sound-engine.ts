"use client";

/**
 * A tiny synthesized sound engine — no audio files, no network requests.
 * Every sound is generated on the fly with the Web Audio API (oscillators
 * + gain envelopes), which keeps this dependency-free and avoids sourcing
 * or licensing actual sound assets.
 *
 * Browsers suspend a freshly-created AudioContext until it's resumed
 * inside a real user gesture (a click/tap handler) — this is a platform
 * restriction, not a bug here. Call `unlockAudio()` from as many genuine
 * tap handlers as reasonable (join, create, start, mute-toggle); it's a
 * cheap no-op once the context is already running. If nothing has
 * unlocked it yet, `playTones` just silently skips instead of throwing,
 * so a missed unlock degrades to "no sound" rather than a console error.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as any).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  return ctx;
}

export function unlockAudio() {
  const c = getCtx();
  if (c && c.state === "suspended") c.resume().catch(() => {});
}

type Tone = {
  freq: number;
  /** Seconds from "now" that this tone starts — lets a call schedule a short melody in one shot. */
  start: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
};

function playTones(tones: Tone[]) {
  const c = getCtx();
  if (!c || c.state === "suspended") return; // not unlocked yet — fail silent, not loud
  const now = c.currentTime;
  for (const t of tones) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = t.type ?? "sine";
    osc.frequency.value = t.freq;
    const peak = t.gain ?? 0.18;
    const startAt = now + t.start;
    const endAt = startAt + t.dur;
    // Fast linear attack, exponential decay — avoids the click/pop a hard
    // on/off would produce, without needing a real envelope curve.
    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(peak, startAt + Math.min(0.015, t.dur / 4));
    gain.gain.exponentialRampToValueAtTime(0.0001, endAt);
    osc.connect(gain).connect(c.destination);
    osc.start(startAt);
    osc.stop(endAt + 0.02);
  }
}

/** One short, neutral beep — used for each countdown number ticking down. */
export function playCountdownTick() {
  playTones([{ freq: 620, start: 0, dur: 0.12, type: "sine", gain: 0.16 }]);
}

/** The "يلا!" / "Go!" moment — a quick two-note upward chirp, more energy than a tick. */
export function playCountdownGo() {
  playTones([
    { freq: 660, start: 0, dur: 0.1, type: "triangle", gain: 0.2 },
    { freq: 990, start: 0.09, dur: 0.24, type: "triangle", gain: 0.22 },
  ]);
}

/** Sharper and higher than the countdown tick, for the final 5 seconds of a round timer. */
export function playUrgentTick() {
  playTones([{ freq: 880, start: 0, dur: 0.09, type: "square", gain: 0.1 }]);
}

/** Winner-reveal fanfare: a rising major arpeggio plus a little sparkle on top. */
export function playCelebration() {
  const base = 523.25; // C5
  const ratios = [1, 1.26, 1.5, 2]; // root, third, fifth, octave
  playTones(
    ratios.map((r, i) => ({
      freq: base * r,
      start: i * 0.11,
      dur: 0.34,
      type: "triangle" as OscillatorType,
      gain: 0.16,
    }))
  );
  playTones([{ freq: base * 3, start: 0.42, dur: 0.5, type: "sine", gain: 0.12 }]);
}
