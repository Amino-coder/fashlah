export type BidalLang = "ar" | "en";

export const BIDAL_STR = {
  ar: {
    dir: "rtl" as const,
    gameNameArabic: "بدل الكلمة",
    tagline: "بدّل حرف. أسرع من الباقين. خلّص حروفك. 😈",
    playSolo: "ابدأ اللعبة",
    backHome: "الصفحة الرئيسية",
    shuffleLabel: "تبديل الحروف",
    yourLetters: "حروفك",
    remaining: "متبقي",
  },
  en: {
    dir: "ltr" as const,
    gameNameArabic: "بدل الكلمة",
    tagline: "Swap a letter. Beat the rest. Empty your hand. 😈",
    playSolo: "Start Game",
    backHome: "Home",
    shuffleLabel: "Shuffle Letters",
    yourLetters: "Your Letters",
    remaining: "remaining",
  },
} as const;
