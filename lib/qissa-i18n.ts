export type QissaLang = "ar" | "en";

export const QISSA_STR: Record<QissaLang, Record<string, string>> = {
  ar: {
    dir: "rtl",
    gameNameArabic: "كمل القصة",
    gameNameLatin: "Complete the Story",
    startGame: "ابدأ اللعبة",
    subtitles: JSON.stringify([
      "قصة توها تبدأ... وبتنتهي عندك 😂",
      "كل واحد يضيف جملة، والنتيجة فوضى حلوة",
      "لعبة التليفون بس بالقصص",
      "ما تدري وش راح توصل له القصة",
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
    errorNeedTwoPlayers: "لازم شخصين على الأقل عشان تبدأ",
    startNewGame: "ابدأ جلسة جديدة",
    roomCode: "كود الغرفة",
    playersJoined: "منضم",
    waitingHost: "بانتظار المضيف يبدأ اللعبة...",
    notThisSession: "مو هالجلسة؟ غيّر الكود",
    joiningSession: "بتنضم لجلسة",
    // Writing
    startNewStory: "ابدأ قصة جديدة",
    continueStoryHeading: "كمّل القصة بجملة وحدة",
    finalRoundWarning: "🚨 هذي آخر جولة! خلّها نهاية مضحكة 😂",
    submitSentence: "إرسال",
    sentenceSubmitted: "تم الإرسال! بانتظار الباقين...",
    wroteCount: "كتبوا",
    // Passing beat
    passingTitle: "قاعدين نخلط القصص",
    // Final reveal
    finalCheer: "خلصنا! شوفوا وش صار",
    storyLabel: "القصة",
    writtenByLabel: "كتبها",
    nextStory: "القصة التالية",
    tapToContinue: "اضغط اي مكان عشان تكمل",
    finishedAllStories: "خلصنا كل القصص!",
  },
  en: {
    dir: "ltr",
    gameNameArabic: "كمل القصة",
    gameNameLatin: "Complete the Story",
    startGame: "Start Game",
    subtitles: JSON.stringify([
      "A story that starts fresh... and ends with you 😂",
      "Everyone adds one line — chaos ensues",
      "Telephone, but with stories",
      "You never know where it'll end up",
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
    errorNeedTwoPlayers: "You need at least 2 players to start",
    startNewGame: "Start a New Game",
    roomCode: "Room Code",
    playersJoined: "joined",
    waitingHost: "Waiting for the host to start...",
    notThisSession: "Not this session? Change code",
    joiningSession: "Joining session",
    // Writing
    startNewStory: "Start a new story",
    continueStoryHeading: "Add one sentence to keep the story going",
    finalRoundWarning: "🚨 Last round! End it on a funny note 😂",
    submitSentence: "Submit",
    sentenceSubmitted: "Submitted! Waiting for the others...",
    wroteCount: "wrote",
    // Passing beat
    passingTitle: "Mixing up the stories...",
    // Final reveal
    finalCheer: "That's a wrap — let's see what happened",
    storyLabel: "Story",
    writtenByLabel: "Written by",
    nextStory: "Next Story",
    tapToContinue: "Tap anywhere to continue",
    finishedAllStories: "That's every story!",
  },
};

export function qissaSubtitles(lang: QissaLang): string[] {
  return JSON.parse(QISSA_STR[lang].subtitles);
}

export const QISSA_AVATARS = ["📖", "🎭", "🗯️", "😄", "🤔", "📚", "✍️", "🎪"];

// Placeholder only — never submitted. A random one shows each time a
// player reaches a writing turn, and disappears the moment they start
// typing (standard placeholder behavior).
//
// Split into two pools because continuation-style prompts ("what happened
// next?") don't make sense on round 1, where there's no story yet to
// continue — showing one there confused players into thinking they had
// to continue something that didn't exist. Round 1 gets its own
// starting-fresh pool instead.
export const QISSA_PLACEHOLDERS_START_AR = [
  "ابدأ قصتك من أي مكان…",
  "اكتب أول جملة تجيك في بالك.",
  "زيد شخصية وابدأ فيها.",
  "خلّها تبدأ بطريقتك.",
  "اكتب جملة وحدة بس.",
];

export const QISSA_PLACEHOLDERS_CONTINUE_AR = [
  "وش صار بعدين؟",
  "حط مفاجأة.",
  "غيّر مسار القصة.",
  "وش صار فجأة؟",
  "وش كانت ردة فعلهم؟",
  "اكتب جملة وحدة بس.",
];

export const QISSA_PLACEHOLDERS_START_EN = [
  "Start anywhere you like…",
  "Write the first sentence that comes to mind.",
  "Introduce a character and go from there.",
  "Kick it off however you want.",
  "Write just one sentence.",
];

export const QISSA_PLACEHOLDERS_CONTINUE_EN = [
  "What happened next?",
  "Add a surprise.",
  "Change the direction of the story.",
  "What suddenly happened?",
  "What was their reaction?",
  "Write just one sentence.",
];

export function randomPlaceholder(lang: QissaLang, isFirstRound: boolean): string {
  const list = isFirstRound
    ? (lang === "ar" ? QISSA_PLACEHOLDERS_START_AR : QISSA_PLACEHOLDERS_START_EN)
    : (lang === "ar" ? QISSA_PLACEHOLDERS_CONTINUE_AR : QISSA_PLACEHOLDERS_CONTINUE_EN);
  return list[Math.floor(Math.random() * list.length)];
}
