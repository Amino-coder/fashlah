export type ShofahLang = "ar" | "en";

export const SHOFAH_STR: Record<ShofahLang, Record<string, string>> = {
  ar: {
    dir: "rtl",
    gameNameArabic: "شوفة",
    gameNameLatin: "First Date",
    startGame: "ابدأ اللعبة",
    subtitles: JSON.stringify([
      "خلّنا نشوف مين بيتزوج أول 😂",
      "لعبة للسناقل 👀",
      "هل أنت مشروع زواج؟",
      "جاوب... ويمكن تتزوج 😂",
    ]),
    charSelectTitle: "مين اللي بتحاولون تعجبونه؟",
    girlLabel: "فتاة",
    guyLabel: "شاب",
    continueBtn: "التالي",
    backHome: "الصفحة الرئيسية",
    phase2Notice: "الردهة والتحدي الجماعي بييجون في المرحلة الجاية 🚧",
  },
  en: {
    dir: "ltr",
    gameNameArabic: "شوفة",
    gameNameLatin: "First Date",
    startGame: "Start Game",
    subtitles: JSON.stringify([
      "Let's see who gets married first 😂",
      "A game for the eternally single 👀",
      "Are you marriage material?",
      "Answer... and maybe get married 😂",
    ]),
    charSelectTitle: "Who is everyone trying to impress?",
    girlLabel: "Girl",
    guyLabel: "Guy",
    continueBtn: "Continue",
    backHome: "Home",
    phase2Notice: "The lobby and live multiplayer round are coming in Phase 2 🚧",
  },
};

export function shofahSubtitles(lang: ShofahLang): string[] {
  return JSON.parse(SHOFAH_STR[lang].subtitles);
}
