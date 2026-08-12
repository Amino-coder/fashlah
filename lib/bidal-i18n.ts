export type BidalLang = "ar" | "en";

export const BIDAL_STR = {
  ar: {
    dir: "rtl" as const,
    gameNameArabic: "بدل الكلمة",
    tagline: "بدّل حرف. أسرع من الباقين. خلّص حروفك. 😈",
    playSolo: "ابدأ اللعبة",
    backHome: "الصفحة الرئيسية",
    loading: "...",
    errorGeneric: "صار خطأ، حاول مرة ثانية",
    shuffleLabel: "تبديل الحروف",
    yourLetters: "حروفك",
    remaining: "متبقي",
    lettersUsed: "حرف استخدمته",
  },
  en: {
    dir: "ltr" as const,
    gameNameArabic: "بدل الكلمة",
    tagline: "Swap a letter. Beat the rest. Empty your hand. 😈",
    playSolo: "Start Game",
    backHome: "Home",
    loading: "...",
    errorGeneric: "Something went wrong, try again",
    shuffleLabel: "Shuffle Letters",
    yourLetters: "Your Letters",
    remaining: "remaining",
    lettersUsed: "letters used",
  },
} as const;

export const BIDAL_AVATARS = ["😎", "🔥", "🧠", "⚡", "🎯", "😈", "🚀", "🏆"];
