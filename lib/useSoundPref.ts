"use client";

import { useEffect, useState } from "react";
import { unlockAudio } from "./sound-engine";

/**
 * Whether game sound effects are on, persisted to localStorage under a
 * key shared across games (so muting in one game stays muted in another).
 * Defaults to on — sound effects here are short and infrequent (a
 * countdown tick, a final-five-seconds beep, a winner fanfare), not a
 * looping soundtrack, so defaulting to silence would mean most people
 * never discover they exist.
 *
 * `ready` mirrors the pattern in usePrefs: false until localStorage has
 * been read, so callers can avoid a flash of the wrong toggle state.
 */
export function useSoundPref() {
  const [enabled, setEnabledState] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("bagdoonis_sound");
    setEnabledState(stored === null ? true : stored === "1");
    setReady(true);
  }, []);

  const setEnabled = (v: boolean) => {
    setEnabledState(v);
    localStorage.setItem("bagdoonis_sound", v ? "1" : "0");
    // Toggling is itself a genuine tap — piggyback the unlock here so
    // turning sound ON is guaranteed to also make it audible immediately,
    // rather than requiring some later unrelated tap to unlock playback.
    if (v) unlockAudio();
  };

  return { enabled, setEnabled, ready };
}
