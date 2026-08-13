export type LifooLang = "ar" | "en";

export const LIFOO_STR: Record<LifooLang, Record<string, string>> = {
  ar: {
    dir: "rtl",
    gameNameArabic: "الِّفوا أغنية",
    gameNameLatin: "Build a Song",
    startGame: "ابدأ اللعبة",
    playSolo: "لعب فردي",
    playMultiplayer: "لعب جماعي",
    subtitles: JSON.stringify([
      "الِّفوا أغنية سوا، سطر سطر 🎶",
      "شو بيصير للأغنية بعد ٤ جولات؟ 😂",
      "بيت وحد، وأربع جولات",
      "أغنية جماعية محد يعرف وش راح تصير",
    ]),
    continueBtn: "التالي",
    backHome: "الصفحة الرئيسية",
    nickname: "اسمك",
    nicknamePh: "اكتب اسمك او لقبك",
    codeLabel: "كود الغرفة",
    codePh: "اكتب الكود",
    joinSession: "انضم لجلسة",
    joinBtn: "انضم",
    createBtn: "استضف الجلسة",
    loading: "لحظة...",
    errorGeneric: "صار خطأ، حاول مرة ثانية",
    errorNotFound: "ما لقينا هالجلسة، تأكد من الكود",
    errorSessionStarted: "هالجلسة بدأت قبل لا تنضم. ودك تبدأ جلسة جديدة؟",
    startNewGame: "ابدأ جلسة جديدة",
    roomCode: "كود الغرفة",
    playersJoined: "منضم",
    waitingHost: "بانتظار المضيف يبدأ اللعبة...",
    voteHeader: "صوّت لأحلى سطر! 🗳️",
    notThisSession: "مو هالجلسة؟ غيّر الكود",
    joiningSession: "بتنضم لجلسة",
    whatsapp: "واتساب",
    copyCode: "نسخ الكود",
    copied: "✅ انتسخ!",
    // Opening selection
    openingSelectTitle: "اختر بداية أغنيتك 🎶",
    openingSelectSub: "منها بتبدأ الأغنية",
    openingSelectWaitingHost: "المضيف يختار بداية الأغنية الحين...",
    customOpeningLabel: "ألّف من عندك ✍️",
    customOpeningConfirm: "ابدأ الأغنية",
    poetLabel: "الفنان",
    writtenByLabel: "بقلم",
    // Round writing — ONE line per round, not two hemistichs
    writeNextLine: "أكمل السطر التالي",
    lineLabel: "سطرك",
    linePh: "اكتب سطرك...",
    submitLine: "إرسال",
    lineSubmitted: "تم الإرسال! بانتظار الباقين...",
    poemSoFar: "الأغنية إلى الآن",
    lineLocked: "🔒 تم قفل السطر!",
    writtenBy: "✍️ كتبها",
    yourLine: "✍️ سطرك",
    // Final reveal
    finalCheer: "يا سلام عليكم",
    poemTitle: "أغنيتك",
    shareCardTitle: "لفّوها",
    shareCardBtn: "شارك الأغنية",
    savedToDevice: "تم حفظ الأغنية في جهازك",
    shareFailed: "تعذّر تجهيز الصورة، حاول مرة أخرى",
    tapToContinue: "اضغط اي مكان عشان تكمل",
  },
  en: {
    dir: "ltr",
    gameNameArabic: "الِّفوا أغنية",
    gameNameLatin: "Build a Song",
    startGame: "Start Game",
    playSolo: "Solo Play",
    playMultiplayer: "Group Play",
    subtitles: JSON.stringify([
      "Build a song together, line by line 🎶",
      "What will the song become after 4 rounds? 😂",
      "One starting verse, four rounds",
      "A group song nobody can predict",
    ]),
    continueBtn: "Continue",
    backHome: "Home",
    nickname: "Your name",
    nicknamePh: "What should we call you?",
    codeLabel: "Room Code",
    codePh: "Enter the code",
    joinSession: "Join a Session",
    joinBtn: "Join",
    createBtn: "Host a Session",
    loading: "One sec...",
    errorGeneric: "Something went wrong, try again",
    errorNotFound: "Couldn't find that session, check the code",
    errorSessionStarted: "This game already started without you. Want to start a new one?",
    startNewGame: "Start a New Game",
    roomCode: "Room Code",
    playersJoined: "joined",
    waitingHost: "Waiting for the host to start...",
    voteHeader: "Vote for the best line! 🗳️",
    notThisSession: "Not this session? Change code",
    joiningSession: "Joining session",
    whatsapp: "WhatsApp",
    copyCode: "Copy code",
    copied: "✅ Copied!",
    // Opening selection
    openingSelectTitle: "Choose your song's start 🎶",
    openingSelectSub: "The song grows from here",
    openingSelectWaitingHost: "The host is choosing the starting verse...",
    customOpeningLabel: "Write your own ✍️",
    customOpeningConfirm: "Start the song",
    poetLabel: "Artist",
    writtenByLabel: "Written by",
    // Round writing
    writeNextLine: "Add the next line",
    lineLabel: "Your line",
    linePh: "Write your line...",
    submitLine: "Submit",
    lineSubmitted: "Submitted! Waiting for the others...",
    poemSoFar: "The song so far",
    lineLocked: "🔒 Line locked!",
    writtenBy: "✍️ Written by",
    yourLine: "✍️ Your line",
    // Final reveal
    finalCheer: "Well sung",
    poemTitle: "Your Song",
    shareCardTitle: "Written by",
    shareCardBtn: "Share the song",
    savedToDevice: "Saved the song card to your device",
    shareFailed: "Couldn't prepare the image, try again",
    tapToContinue: "Tap anywhere to continue",
  },
};

export function lifooSubtitles(lang: LifooLang): string[] {
  return JSON.parse(LIFOO_STR[lang].subtitles);
}

// Music/party motifs rather than قصيدة's calmer writing/nature set —
// matches the "funny, fast, social" tone the spec asks for.
export const LIFOO_AVATARS = ["🎶", "🎤", "🎸", "🥁", "🎧", "🕺", "💃", "🔥"];

// The three curated starting verses — the client's own copy of what's
// seeded into lifoo_openings (supabase/lifoo_schema.sql), so solo mode
// can offer the exact same three options without any network round trip.
// Keep these two in sync if the seed content ever changes.
export type LifooOpeningOption = { id: string; category: string; line1: string; line2: string; poet: string };

export const LIFOO_STATIC_OPENINGS: LifooOpeningOption[] = [
  { id: "warda", category: "طرب", line1: "بتونس بيك وإنت معايا", line2: "بتونس بيك وبلاقي في قربك دنيايا", poet: "وردة الجزائرية" },
  { id: "abdu", category: "طرب سعودي", line1: "الأماكن كلها مشتاقة لك", line2: "والعيون اللي انرسم فيها خيالك", poet: "محمد عبده" },
  { id: "abdulrahman", category: "شعر غزل", line1: "أصابك عشق أم رميت بأسهم", line2: "فما هذه إلا سجية مغرم", poet: "عبدالرحمن محمد" },
];
