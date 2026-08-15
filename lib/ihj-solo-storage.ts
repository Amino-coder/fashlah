/**
 * The whole reason this exists: in solo, the player's opponent is their
 * own previous score (see the spec this was built from) — there's no
 * other player and deliberately no account requirement, so this has to
 * live somewhere that survives a refresh without ever asking anyone to
 * sign up. localStorage is exactly that.
 */
const KEY = "bagdoonis_ihj_solo_best";

export type IhjSoloBest = {
  score: number;
  correctCount: number;
  totalPossible: number;
  totalRounds: number;
  at: string;
};

export function readIhjSoloBest(): IhjSoloBest | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null; // private browsing / storage disabled — just means no "beat your record" this session
  }
}

export function writeIhjSoloBest(result: IhjSoloBest) {
  try {
    localStorage.setItem(KEY, JSON.stringify(result));
  } catch { /* nothing to persist if storage isn't available */ }
}
