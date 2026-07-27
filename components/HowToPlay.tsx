"use client";

import { useCallback, useEffect, useState } from "react";
import { HelpCircle, X } from "lucide-react";
import type { Lang } from "@/lib/i18n";

/**
 * "How to play" — the explainer the app was missing entirely.
 *
 * Modelled on how the NYT puzzle apps handle it: it opens by itself the
 * first time someone lands on a game, then afterwards lives behind a small
 * "?" button so it never gets in the way again. That matters here more than
 * for a solo puzzle, because these games get opened cold in front of a
 * group — whoever's holding the phone shouldn't have to explain the rules
 * from memory.
 */

export type GameKey = "fashlah" | "shofah" | "job";

type Step = { icon: string; title: string; body: string };
type Content = { title: string; tagline: string; steps: Step[]; footer: string };

const CONTENT: Record<GameKey, Record<Lang, Content>> = {
  fashlah: {
    ar: {
      title: "كيف تلعبون فشلة؟",
      tagline: "٤ جولات، وبعدها النتائج 🌿",
      steps: [
        { icon: "📱", title: "جهاز لكل شخص", body: "المضيف ينشئ غرفة ويشارك الكود، والباقي ينضمون من جوالاتهم." },
        { icon: "🙋", title: "الجولة ١: عنك", body: "جاوب أسئلة عن نفسك بصراحة." },
        { icon: "🗳️", title: "الجولة ٢: صوّتوا لأصحابكم", body: "مين من الشلة الأغلب يسوي كذا؟" },
        { icon: "🔥", title: "الجولة ٣: آراء جريئة", body: "أوافق ولا ما أوافق؟ لا تجامل." },
        { icon: "🎲", title: "الجولة ٤: مفاجآت", body: "أسئلة «مين بتفضل» وأكمل الفراغ." },
        { icon: "🏆", title: "النتائج", body: "شخصيتك، ألقابك، وأقرب شخص لك في الشلة." },
      ],
      footer: "ما فيه إجابة غلط — كل ما كنت صادق، صارت أحلى 😂",
    },
    en: {
      title: "How to play Fashlah",
      tagline: "4 rounds, then your results 🌿",
      steps: [
        { icon: "📱", title: "One phone each", body: "The host creates a room and shares the code — everyone else joins from their own phone." },
        { icon: "🙋", title: "Round 1: About You", body: "Answer honest questions about yourself." },
        { icon: "🗳️", title: "Round 2: Vote for Friends", body: "Who in the group is most likely to...?" },
        { icon: "🔥", title: "Round 3: Hot Takes", body: "Agree or disagree. Don't play it safe." },
        { icon: "🎲", title: "Round 4: Wildcard", body: "Would-you-rather questions and fill-in-the-blanks." },
        { icon: "🏆", title: "Results", body: "Your personality, your awards, and who you match with most." },
      ],
      footer: "There are no wrong answers — the honest ones are the funniest 😂",
    },
  },
  shofah: {
    ar: {
      title: "كيف تلعبون ابي اتزوج؟",
      tagline: "جولة تسخين، ٥ أسئلة، وبعدها الشوفة 💍",
      steps: [
        { icon: "💍", title: "اختاروا الشخصية", body: "مزنة ولا مرعي؟ الكل بيحاول يعجبه." },
        { icon: "📱", title: "جهاز لكل شخص", body: "المضيف ينشئ غرفة ويشارك الكود مع الشلة." },
        { icon: "🔥", title: "جولة التسخين", body: "٥ أسئلة سريعة، صوّتوا على بعض. للضحك بس — ما تحسب في النتيجة." },
        { icon: "✍️", title: "٥ جولات", body: "يجيكم سؤال، وكل واحد يكتب رده بأحلى طريقة." },
        { icon: "🗳️", title: "صوّتوا", body: "بعدها صوّتوا على أحلى رد — وبتشوفون مين كتب وش." },
        { icon: "💒", title: "الشوفة", body: "بالنهاية تشوفون المحادثة كاملة، ومين اللي فاز بالزواج." },
      ],
      footer: "الردود الأجرأ عادة هي اللي تفوز 👀",
    },
    en: {
      title: "How to play Marry Me!",
      tagline: "A warm-up, 5 questions, then the big reveal 💍",
      steps: [
        { icon: "💍", title: "Pick who you're impressing", body: "Mazna or Mar'i? Everyone's trying to win them over." },
        { icon: "📱", title: "One phone each", body: "The host creates a room and shares the code with the group." },
        { icon: "🔥", title: "Warm-up round", body: "5 quick questions voting on each other. Just for laughs — it doesn't affect scoring." },
        { icon: "✍️", title: "5 rounds", body: "You get a prompt, and everyone writes their best reply." },
        { icon: "🗳️", title: "Vote", body: "Then vote for the best answer — and find out who wrote what." },
        { icon: "💒", title: "The reveal", body: "At the end you'll see the full conversation, and who wins the marriage." },
      ],
      footer: "The bolder answers usually win 👀",
    },
  },
  job: {
    ar: {
      title: "كيف تلعبون مين بيتوظف؟",
      tagline: "جولة تسخين، ٥ أسئلة، وبعدها القرار 💼",
      steps: [
        { icon: "💼", title: "المقابلة بدت", body: "كلكم متقدمين على نفس الوظيفة، والمدير يراقب." },
        { icon: "📱", title: "جهاز لكل شخص", body: "المضيف ينشئ غرفة ويشارك الكود مع الشلة." },
        { icon: "🔥", title: "جولة التسخين", body: "٥ أسئلة سريعة، صوّتوا على بعض. للضحك بس — ما تحسب في النتيجة." },
        { icon: "✍️", title: "٥ أسئلة", body: "يجيكم سؤال مقابلة، وكل واحد يكتب رده بأحلى طريقة." },
        { icon: "🗳️", title: "صوّتوا", body: "بعدها صوّتوا على أحلى رد — وبتشوفون مين كتب وش." },
        { icon: "🤝", title: "القرار", body: "بالنهاية تشوفون المقابلة كاملة، ومين اللي انوظف." },
      ],
      footer: "الردود الأجرأ عادة هي اللي تفوز 👀",
    },
    en: {
      title: "How to play Job Interview!",
      tagline: "A warm-up, 5 questions, then the decision 💼",
      steps: [
        { icon: "💼", title: "The interview starts", body: "You're all applying for the same job, and the boss is watching." },
        { icon: "📱", title: "One phone each", body: "The host creates a room and shares the code with the group." },
        { icon: "🔥", title: "Warm-up round", body: "5 quick questions voting on each other. Just for laughs — it doesn't affect scoring." },
        { icon: "✍️", title: "5 questions", body: "You get an interview question, and everyone writes their best answer." },
        { icon: "🗳️", title: "Vote", body: "Then vote for the best answer — and find out who wrote what." },
        { icon: "🤝", title: "The decision", body: "At the end you'll see the full interview, and who actually gets hired." },
      ],
      footer: "The bolder answers usually win 👀",
    },
  },
};

const ACCENTS: Record<GameKey, { from: string; to: string }> = {
  fashlah: { from: "#FF2E93", to: "#7C3AED" },
  shofah: { from: "#E63946", to: "#C2185B" },
  job: { from: "#3B82F6", to: "#1E40AF" },
};

function storageKey(game: GameKey) {
  return `bagdoonis_seen_howto_${game}`;
}

/** Small circular "?" button. Drop it next to the lang/theme toggles. */
export function HelpButton({
  game, lang, autoOpenFirstVisit = true,
}: {
  game: GameKey;
  lang: Lang;
  autoOpenFirstVisit?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const label = lang === "ar" ? "كيف تلعب" : "How to play";

  // First visit to this specific game opens the rules automatically. Stored
  // per game, so learning Fashlah doesn't silently skip Shofah's rules.
  useEffect(() => {
    if (!autoOpenFirstVisit) return;
    try {
      if (localStorage.getItem(storageKey(game)) === null) setOpen(true);
    } catch { /* private mode — just don't auto-open */ }
  }, [game, autoOpenFirstVisit]);

  const close = useCallback(() => {
    setOpen(false);
    try { localStorage.setItem(storageKey(game), "1"); } catch { /* ignore */ }
  }, [game]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={label}
        title={label}
        style={{
          width: 36, height: 36, borderRadius: 999, background: "var(--card)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 12px var(--ring)", border: "none", color: "var(--ink)",
        }}
      >
        <HelpCircle size={16} />
      </button>
      {open && <HowToPlay game={game} lang={lang} onClose={close} />}
    </>
  );
}

export function HowToPlay({
  game, lang, onClose,
}: {
  game: GameKey;
  lang: Lang;
  onClose: () => void;
}) {
  const c = CONTENT[game][lang];
  const accent = ACCENTS[game];
  const dir = lang === "ar" ? "rtl" : "ltr";

  // Escape to dismiss, and lock background scrolling while open so the page
  // behind doesn't slide around under the sheet on mobile.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={c.title}
      dir={dir}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(10, 6, 25, 0.55)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card screen-enter"
        style={{
          width: "100%", maxWidth: 440, maxHeight: "88vh", overflowY: "auto",
          padding: 0, position: "relative",
          // Sits above the iOS home indicator on notched devices.
          paddingBottom: "max(20px, env(safe-area-inset-bottom))",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "22px 22px 18px",
            background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
            borderTopLeftRadius: 28, borderTopRightRadius: 28,
            color: "#fff", position: "relative",
          }}
        >
          <button
            onClick={onClose}
            aria-label={lang === "ar" ? "إغلاق" : "Close"}
            style={{
              position: "absolute", top: 16, insetInlineEnd: 16,
              width: 30, height: 30, borderRadius: 999, border: "none",
              background: "rgba(255,255,255,0.22)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={16} />
          </button>
          <h2 className="font-display" style={{ fontSize: 22, fontWeight: 800, margin: 0, paddingInlineEnd: 38 }}>
            {c.title}
          </h2>
          <p className="font-body" style={{ fontSize: 13, fontWeight: 600, margin: "6px 0 0", opacity: 0.92 }}>
            {c.tagline}
          </p>
        </div>

        {/* Steps */}
        <div style={{ padding: "18px 22px 6px", display: "flex", flexDirection: "column", gap: 16 }}>
          {c.steps.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
              <div
                aria-hidden="true"
                style={{
                  flexShrink: 0, width: 38, height: 38, borderRadius: 12,
                  background: "var(--ring)", display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: 19,
                }}
              >
                {s.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <p className="font-display" style={{ fontSize: 15, fontWeight: 800, margin: 0, lineHeight: 1.3 }}>
                  {s.title}
                </p>
                <p className="font-body" style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: "3px 0 0", lineHeight: 1.55 }}>
                  {s.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p
          className="font-body"
          style={{
            margin: "18px 22px 16px", padding: "12px 14px", borderRadius: 16,
            background: "var(--ring)", fontSize: 13, fontWeight: 700,
            color: "var(--ink-soft)", textAlign: "center", lineHeight: 1.5,
          }}
        >
          {c.footer}
        </p>

        <div style={{ padding: "0 22px 20px" }}>
          <button
            onClick={onClose}
            className="font-display"
            style={{
              width: "100%", padding: 15, fontSize: 16, borderRadius: 999,
              border: "none", color: "#fff",
              background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
              boxShadow: `0 8px 22px ${accent.from}44`,
            }}
          >
            {lang === "ar" ? "يلا نلعب" : "Let's play"}
          </button>
        </div>
      </div>
    </div>
  );
}
