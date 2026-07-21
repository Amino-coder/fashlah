import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft, ChevronRight, Moon, Sun, Share2, Download,
  Users, Sparkles, Trophy, Check, Plus, Minus, MessageCircle, Link as LinkIcon
} from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
} from "recharts";

/* ---------------------------------- DATA ---------------------------------- */

const STR = {
  ar: {
    dir: "rtl",
    appName: "بقدونس",
    tagline: "اكتشفوا أسرار قروبكم 😂",
    startSession: "ابدأ جلسة",
    joinSession: "انضم لجلسة",
    createTitle: "ابدأ جلسة",
    groupName: "اسم القروب",
    groupNamePh: "مثلاً: شلة الحي",
    maxPlayers: "أقصى عدد لاعبين",
    pack: "الباقة",
    difficulty: "المستوى",
    packFriends: "الأصدقاء",
    packSoon: "قريبًا",
    diffFunny: "مضحك",
    diffChaotic: "فوضوي",
    diffDeep: "عميق",
    diffMixed: "متنوع",
    create: "إنشاء الجلسة",
    shareTitle: "شاركوا الكود",
    roomCode: "كود الغرفة",
    copyLink: "نسخ الرابط",
    shareWhatsapp: "مشاركة واتساب",
    continueToRoom: "المتابعة لغرفة الانتظار",
    joinTitle: "انضم لجلسة",
    codeLabel: "كود الغرفة",
    codePh: "اكتب الكود",
    nickname: "اسمك",
    nicknamePh: "شلونك تحب يناديك القروب؟",
    pickAvatar: "اختر أفاتارك",
    joinBtn: "انضم",
    waitingTitle: "غرفة الانتظار",
    playersJoined: "لاعب انضم",
    startGame: "ابدأ اللعبة",
    waitingHost: "بانتظار المضيف يبدأ اللعبة...",
    loadingMsgs: [
      "أكيد فيه واحد للحين يقرأ الرسالة 👀",
      "وين أكثر واحد يتأخر؟ 😂",
      "واضح إن واحد للحين نايم 😴",
      "لا تتوتر، بقدونس ما يرحم أحد 🌿",
      "شكلها بتصير فضايح اليوم 🍿",
      "خلوا هواتفكم بعيد شوي، الجد يبدأ الحين",
    ],
    round1Title: "الجولة ١: عنك",
    round2Title: "الجولة ٢: صوّتوا لأصحابكم",
    round2Sub: "مين الأغلب يسوي كذا؟",
    round3Title: "الجولة ٣: تحدي إضافي",
    round3Sub: "خمّن النسبة",
    reveal: "شوف النتيجة",
    next: "التالي",
    finish: "انتهينا 🎉",
    resultsIntro1: "جاهزين؟",
    resultsIntro2: "نتائج بقدونس وصلت 🌿✨",
    viewResults: "شاهد النتائج",
    yourPersonality: "شخصيتك",
    topAward: "لقبك الأول",
    moreAwards: "ألقاب ثانية",
    bestFriend: "أفضل توافق",
    friendshipMatch: "نسبة التوافق",
    sharedInterests: "قواسم مشتركة",
    personalSummary: "ملخصك",
    shareCard: "بطاقتك جاهزة",
    downloadImg: "تحميل الصورة",
    igStory: "قصة انستقرام",
    snap: "سناب شات",
    whatsapp: "واتساب",
    backHome: "رجوع للرئيسية",
    you: "أنت",
    demoToast: "🌿 تجريبي: هذا الإجراء وهمي بس في النسخة النهائية بيصدّر صورة حقيقية",
    guessPh: "نسبتك المتوقعة",
    actualWas: "النسبة الحقيقية كانت",
    closeGuess: "تخمين قريب! 🔥",
    farGuess: "بعيد شوي! 😂",
  },
  en: {
    dir: "ltr",
    appName: "Bagdoonis",
    tagline: "Uncover your group's secrets 😂",
    startSession: "Start a Session",
    joinSession: "Join a Session",
    createTitle: "Start a Session",
    groupName: "Group name",
    groupNamePh: "e.g. The Neighborhood Crew",
    maxPlayers: "Max players",
    pack: "Pack",
    difficulty: "Vibe",
    packFriends: "Friends",
    packSoon: "Soon",
    diffFunny: "Funny",
    diffChaotic: "Chaotic",
    diffDeep: "Deep",
    diffMixed: "Mixed",
    create: "Create Session",
    shareTitle: "Share the Code",
    roomCode: "Room Code",
    copyLink: "Copy Link",
    shareWhatsapp: "Share on WhatsApp",
    continueToRoom: "Continue to Waiting Room",
    joinTitle: "Join a Session",
    codeLabel: "Room code",
    codePh: "Enter the code",
    nickname: "Your name",
    nicknamePh: "What should the group call you?",
    pickAvatar: "Pick your avatar",
    joinBtn: "Join",
    waitingTitle: "Waiting Room",
    playersJoined: "players joined",
    startGame: "Start Game",
    waitingHost: "Waiting for the host to start...",
    loadingMsgs: [
      "Someone is definitely still reading the invite 👀",
      "Who's going to be the last one to join? 😂",
      "One of you is clearly still asleep 😴",
      "Don't panic, Bagdoonis shows no mercy 🌿",
      "This is about to get chaotic 🍿",
      "Put your phones down for real now, it's starting",
    ],
    round1Title: "Round 1: About You",
    round2Title: "Round 2: Vote for Friends",
    round2Sub: "Who's most likely to...",
    round3Title: "Round 3: Bonus Round",
    round3Sub: "Guess the percentage",
    reveal: "Reveal",
    next: "Next",
    finish: "We're done 🎉",
    resultsIntro1: "Ready?",
    resultsIntro2: "Your Bagdoonis results are in 🌿✨",
    viewResults: "View Results",
    yourPersonality: "Your Personality",
    topAward: "Your Top Title",
    moreAwards: "More Titles",
    bestFriend: "Best Match",
    friendshipMatch: "Compatibility",
    sharedInterests: "Shared interests",
    personalSummary: "Your Summary",
    shareCard: "Your card is ready",
    downloadImg: "Download Image",
    igStory: "Instagram Story",
    snap: "Snapchat",
    whatsapp: "WhatsApp",
    backHome: "Back Home",
    you: "You",
    demoToast: "🌿 Demo only — the real app would export an actual image",
    guessPh: "Your guess",
    actualWas: "The real number was",
    closeGuess: "Close guess! 🔥",
    farGuess: "Way off! 😂",
  },
};

const AVATARS = ["🌿", "🦊", "🐼", "🐝", "🦁", "🐨", "🐯", "🐸", "🦄", "🐙"];

const PLAYER_POOL = [
  { id: "p1", ar: "سارة", en: "Sara", emoji: "🦊" },
  { id: "p2", ar: "فهد", en: "Fahad", emoji: "🐼" },
  { id: "p3", ar: "نورة", en: "Noura", emoji: "🐝" },
  { id: "p4", ar: "عبدالله", en: "Abdullah", emoji: "🦁" },
  { id: "p5", ar: "ريم", en: "Reem", emoji: "🐨" },
];

const ROUND1 = [
  { ar: "أنا غالبًا…", en: "I'm usually…", opts: [
    { e: "😂", ar: "أضحك", en: "Laughing" }, { e: "😐", ar: "أراقب", en: "Watching" },
    { e: "😴", ar: "أنام", en: "Sleeping" }, { e: "🤯", ar: "أفكر زيادة", en: "Overthinking" } ] },
  { ar: "أنا إذا سافرت…", en: "When I travel…", opts: [
    { e: "🗺️", ar: "أخطط", en: "I plan" }, { e: "🎲", ar: "أرتجل", en: "I improvise" },
    { e: "🌀", ar: "أضيع", en: "I get lost" }, { e: "💤", ar: "أنام بالطريق", en: "I sleep the trip" } ] },
  { ar: "أكثر شيء أصرف عليه…", en: "I spend the most on…", opts: [
    { e: "☕", ar: "قهوة", en: "Coffee" }, { e: "🍔", ar: "أكل", en: "Food" },
    { e: "🚗", ar: "سيارات", en: "Cars" }, { e: "✈️", ar: "سفر", en: "Travel" } ] },
  { ar: "أنا شخص…", en: "I'm someone who's…", opts: [
    { e: "🧘", ar: "هادئ", en: "Calm" }, { e: "🎯", ar: "قيادي", en: "A leader" },
    { e: "🏔️", ar: "مغامر", en: "Adventurous" }, { e: "🌪️", ar: "فوضوي", en: "Chaotic" } ] },
  { ar: "لو صار عندي مليون ريال…", en: "If I had a million…", opts: [
    { e: "💼", ar: "أستثمره", en: "Invest it" }, { e: "🛍️", ar: "أصرفه", en: "Spend it" },
    { e: "✈️", ar: "أسافر", en: "Travel" }, { e: "🏠", ar: "أشتري بيت", en: "Buy a house" } ] },
  { ar: "وقت الأزمات أنا…", en: "In a crisis I'm…", opts: [
    { e: "🧯", ar: "أحل المشكلة", en: "The fixer" }, { e: "😅", ar: "أتوتر", en: "The panicker" },
    { e: "📵", ar: "أختفي", en: "The vanisher" }, { e: "🎬", ar: "أوثّق الموقف", en: "The filmer" } ] },
  { ar: "أكثر شيء يضيّق علي…", en: "What annoys me most…", opts: [
    { e: "⏰", ar: "التأخير", en: "Being late" }, { e: "📱", ar: "التجاهل", en: "Being ignored" },
    { e: "🗣️", ar: "الدراما", en: "Drama" }, { e: "🍽️", ar: "سوء الأكل", en: "Bad food" } ] },
  { ar: "لو صرت مشهور بسبب…", en: "I'd go viral for…", opts: [
    { e: "😂", ar: "موقف مضحك", en: "A funny moment" }, { e: "🕺", ar: "رقصة", en: "A dance" },
    { e: "🍳", ar: "طبخة غريبة", en: "Weird cooking" }, { e: "🗯️", ar: "تغريدة", en: "A tweet" } ] },
];

const ROUND2 = [
  { ar: "يصير غني", en: "Become rich" },
  { ar: "ينسى جواله في مكان", en: "Forget their phone somewhere" },
  { ar: "يفتح خمس مشاريع", en: "Start five businesses" },
  { ar: "يتأخر عن كل شيء", en: "Be late to everything" },
  { ar: "يصير مشهور بالغلط", en: "Go accidentally viral" },
  { ar: "يبدأ دراما", en: "Start drama" },
];

const ROUND3 = [
  { ar: "من الأصحاب بيصمدون بنهاية العالم الزومبي", en: "of your friends would survive a zombie apocalypse", actual: 62 },
  { ar: "منهم نسوا محفظتهم أكثر من مرة", en: "have forgotten their wallet more than once", actual: 78 },
  { ar: "منهم متأكدين إنهم بيصيرون مليونيرات", en: "are sure they'll become millionaires", actual: 54 },
];

const AWARDS = [
  { e: "👑", ar: "الرئيس التنفيذي", en: "The CEO", c: "var(--yellow)" },
  { e: "😂", ar: "صانع الفوضى", en: "Chaos Generator", c: "var(--pink)" },
  { e: "🧠", ar: "ويكيبيديا الماشية", en: "Walking Wikipedia", c: "var(--mint)" },
  { e: "🍕", ar: "عاشق الأكل", en: "Professional Foodie", c: "var(--purple)" },
  { e: "🚗", ar: "دايم متأخر", en: "Always Late", c: "var(--pink)" },
  { e: "💰", ar: "مليونير المستقبل", en: "Future Billionaire", c: "var(--yellow)" },
  { e: "👻", ar: "يشبح القروب", en: "Ghosts the Group Chat", c: "var(--purple)" },
  { e: "📸", ar: "الشخصية الرئيسية", en: "Main Character", c: "var(--mint)" },
];

const RADAR_STATS = [
  { key: "leadership", ar: "القيادة", en: "Leadership", v: 82 },
  { key: "humor", ar: "الفكاهة", en: "Humor", v: 91 },
  { key: "energy", ar: "الطاقة", en: "Energy", v: 76 },
  { key: "loyalty", ar: "الوفاء", en: "Loyalty", v: 88 },
  { key: "adventure", ar: "المغامرة", en: "Adventure", v: 69 },
];

const HIDDEN_STATS = [
  { n: 93, ar: "احتمال تصير مشهور بالغلط قدام القروب", en: "chance you go accidentally viral in front of the group" },
  { n: 78, ar: "من الأصحاب متفقين إنك دايم متأخر", en: "of friends agree you're always late" },
];

const SUMMARY = {
  ar: "أنت شرارة القروب 🔥 طاقتك عالية وحسك الفكاهي ما يخلص، دايم جاهز لأي مغامرة جديدة. أصحابك يعتمدون عليك لأنك موثوق، بس بنفس الوقت يعرفون إنك بتقنعهم يسوّون شي عفوي فجأة 😄",
  en: "You're the spark of the group 🔥 Your energy is high and your humor never runs out — always ready for the next adventure. Your friends count on you because you're dependable, but they also know you'll talk them into something spontaneous 😄",
};

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const genCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
};

/* --------------------------------- STYLES --------------------------------- */

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Baloo+Bhaijaan+2:wght@600;700;800&family=Cairo:wght@500;600;700;800&family=Tajawal:wght@400;500;700&family=JetBrains+Mono:wght@600;700&display=swap');

    .bagdoonis-root {
      --pink: #FF2E93; --yellow: #FFD400; --mint: #2EE6A6; --purple: #7C3AED;
      --bg: #FFFDF7; --card: #FFFFFF; --ink: #17122B; --ink-soft: #6b6280;
      --ring: rgba(23,18,43,0.08);
      background: var(--bg); color: var(--ink);
      min-height: 100vh; width: 100%; position: relative; overflow-x: hidden;
      transition: background .3s ease, color .3s ease;
    }
    .bagdoonis-root.dark {
      --bg: #140F29; --card: #201A3E; --ink: #F6F3FF; --ink-soft: #B4AAD9; --ring: rgba(255,255,255,0.08);
    }
    .f-display { font-family: 'Baloo 2', 'Baloo Bhaijaan 2', sans-serif; }
    .f-body { font-family: 'Tajawal', 'Nunito', sans-serif; }
    [dir="rtl"] .f-display { font-family: 'Baloo Bhaijaan 2', 'Baloo 2', sans-serif; }
    .f-mono { font-family: 'JetBrains Mono', monospace; letter-spacing: 0.15em; }

    .blob { position: absolute; border-radius: 50%; filter: blur(50px); opacity: 0.35; z-index: 0; animation: drift 14s ease-in-out infinite; }
    @keyframes drift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(20px,-24px) scale(1.08); } }

    .stage { max-width: 480px; margin: 0 auto; position: relative; z-index: 1; min-height: 100vh; display: flex; flex-direction: column; }

    .card { background: var(--card); border-radius: 28px; box-shadow: 0 10px 30px var(--ring); }
    .btn-primary { background: linear-gradient(135deg, var(--pink), var(--purple)); color: white; border-radius: 999px; font-weight: 700; box-shadow: 0 8px 20px rgba(255,46,147,0.35); transition: transform .15s ease; }
    .btn-primary:active { transform: scale(0.96); }
    .btn-primary:disabled { opacity: 0.4; box-shadow: none; }
    .btn-ghost { background: var(--card); color: var(--ink); border-radius: 999px; font-weight: 700; border: 2px solid var(--ring); transition: transform .15s ease; }
    .btn-ghost:active { transform: scale(0.96); }

    .chip { border-radius: 999px; padding: 10px 16px; font-weight: 700; border: 2px solid var(--ring); background: var(--card); color: var(--ink-soft); transition: all .15s ease; }
    .chip.active { border-color: transparent; color: white; background: linear-gradient(135deg, var(--pink), var(--purple)); transform: scale(1.04); }
    .chip.disabled { opacity: 0.4; }

    .screen-enter { animation: fadeSlide .38s cubic-bezier(.2,.8,.2,1); }
    @keyframes fadeSlide { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
    .pop { animation: pop .35s cubic-bezier(.34,1.56,.64,1); }
    @keyframes pop { from { opacity: 0; transform: scale(.7); } to { opacity: 1; transform: scale(1); } }
    .bounce { animation: bounce 2.4s ease-in-out infinite; }
    @keyframes bounce { 0%,100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-10px) rotate(2deg); } }
    .wiggle:active { animation: wiggle .3s ease; }
    @keyframes wiggle { 0%,100% { transform: rotate(0); } 25% { transform: rotate(-6deg); } 75% { transform: rotate(6deg); } }

    .progress-track { height: 8px; border-radius: 999px; background: var(--ring); overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--mint), var(--pink)); transition: width .4s ease; }

    .story-seg { height: 4px; border-radius: 999px; background: rgba(255,255,255,0.3); flex: 1; overflow: hidden; }
    .story-seg-fill { height: 100%; background: white; }

    .confetti-piece { position: absolute; top: -10%; font-size: 22px; animation: fall linear forwards; }
    @keyframes fall { to { transform: translateY(110vh) rotate(360deg); opacity: 0.2; } }

    input[type=range] { -webkit-appearance: none; height: 10px; border-radius: 999px; background: var(--ring); }
    input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 26px; height: 26px; border-radius: 50%; background: var(--pink); border: 4px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.25); cursor: pointer; }

    .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: var(--ink); color: var(--bg); padding: 12px 20px; border-radius: 999px; font-weight: 600; font-size: 14px; z-index: 50; max-width: 90%; text-align: center; animation: pop .3s ease; }
  `}</style>
);

/* --------------------------------- PIECES --------------------------------- */

function Blobs() {
  return (
    <>
      <div className="blob" style={{ width: 220, height: 220, background: "var(--pink)", top: -40, insetInlineStart: -60 }} />
      <div className="blob" style={{ width: 260, height: 260, background: "var(--mint)", top: 180, insetInlineEnd: -80, animationDelay: "2s" }} />
      <div className="blob" style={{ width: 200, height: 200, background: "var(--yellow)", bottom: 60, insetInlineStart: -50, animationDelay: "4s" }} />
      <div className="blob" style={{ width: 180, height: 180, background: "var(--purple)", bottom: -40, insetInlineEnd: 20, animationDelay: "1s" }} />
    </>
  );
}

function Mascot({ mood = "happy", size = 72, className = "" }) {
  const wink = mood === "wink";
  const excited = mood === "excited";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <path d="M50 8 C54 18 60 20 58 28 C54 24 46 24 42 28 C40 20 46 18 50 8 Z" fill="var(--yellow)" />
      <ellipse cx="50" cy="58" rx="36" ry="32" fill="var(--mint)" />
      <circle cx="37" cy="52" r="9" fill="white" />
      {wink ? (
        <path d="M30 52 Q37 58 44 52" stroke="#17122B" strokeWidth="3" fill="none" strokeLinecap="round" />
      ) : (
        <circle cx={excited ? 39 : 37} cy="53" r="4" fill="#17122B" />
      )}
      <circle cx="63" cy="52" r="9" fill="white" />
      <circle cx={excited ? 65 : 63} cy="53" r="4" fill="#17122B" />
      <path
        d={excited ? "M38 68 Q50 82 62 68" : "M38 68 Q50 76 62 68"}
        stroke="#17122B" strokeWidth="4" fill="none" strokeLinecap="round"
      />
      <circle cx="24" cy="62" r="5" fill="var(--pink)" opacity="0.6" />
      <circle cx="76" cy="62" r="5" fill="var(--pink)" opacity="0.6" />
    </svg>
  );
}

function Confetti({ seed = 0 }) {
  const pieces = ["🎉", "✨", "🌿", "💥", "⭐", "🎊"];
  const items = Array.from({ length: 22 }, (_, i) => ({
    id: `${seed}-${i}`,
    left: Math.random() * 100,
    delay: Math.random() * 0.6,
    dur: 2 + Math.random() * 1.5,
    piece: rand(pieces),
    size: 16 + Math.random() * 14,
  }));
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 2 }}>
      {items.map((it) => (
        <span key={it.id} className="confetti-piece" style={{ left: `${it.left}%`, animationDelay: `${it.delay}s`, animationDuration: `${it.dur}s`, fontSize: it.size }}>
          {it.piece}
        </span>
      ))}
    </div>
  );
}

function CountUp({ to, duration = 900, suffix = "" }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let start = null;
    let raf;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return <span>{v}{suffix}</span>;
}

function TopBar({ t, lang, setLang, dark, setDark, onBack, title, progress }) {
  const BackIcon = lang === "ar" ? ChevronRight : ChevronLeft;
  return (
    <div className="screen-enter" style={{ padding: "18px 20px 8px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ width: 40 }}>
          {onBack && (
            <button onClick={onBack} className="wiggle" style={{ width: 40, height: 40, borderRadius: 999, background: "var(--card)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px var(--ring)" }}>
              <BackIcon size={20} />
            </button>
          )}
        </div>
        {title && <div className="f-display" style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="chip"
            style={{ padding: "6px 12px", fontSize: 12 }}
          >
            {lang === "ar" ? "EN" : "AR"}
          </button>
          <button
            onClick={() => setDark(!dark)}
            style={{ width: 36, height: 36, borderRadius: 999, background: "var(--card)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px var(--ring)" }}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
      {typeof progress === "number" && (
        <div className="progress-track" style={{ marginTop: 14 }}>
          <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
    </div>
  );
}

/* --------------------------------- SCREENS --------------------------------- */

function Home({ t, lang, setLang, dark, setDark, go }) {
  return (
    <div className="screen-enter" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px 24px 40px" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} className="chip" style={{ padding: "6px 14px", fontSize: 13 }}>
          {lang === "ar" ? "EN" : "AR"}
        </button>
        <button onClick={() => setDark(!dark)} style={{ width: 36, height: 36, borderRadius: 999, background: "var(--card)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px var(--ring)" }}>
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 18 }}>
        <Mascot size={110} className="bounce" mood="excited" />
        <div>
          <h1 className="f-display" style={{ fontSize: 44, fontWeight: 800, margin: 0, background: "linear-gradient(135deg, var(--pink), var(--purple))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {t.appName} 🌿
          </h1>
          <p className="f-body" style={{ fontSize: 17, color: "var(--ink-soft)", marginTop: 8, fontWeight: 600 }}>{t.tagline}</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <button onClick={() => go("create")} className="btn-primary f-display" style={{ padding: "18px", fontSize: 18 }}>
          {t.startSession}
        </button>
        <button onClick={() => go("join")} className="btn-ghost f-display" style={{ padding: "18px", fontSize: 18 }}>
          {t.joinSession}
        </button>
      </div>
    </div>
  );
}

function CreateSession({ t, lang, onDone }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🌿");
  const [max, setMax] = useState(6);
  const [diff, setDiff] = useState(0);
  const diffs = [t.diffFunny, t.diffChaotic, t.diffDeep, t.diffMixed];

  return (
    <div className="screen-enter" style={{ padding: "12px 24px 32px", display: "flex", flexDirection: "column", gap: 22 }}>
      <div className="card" style={{ padding: 20 }}>
        <label className="f-body" style={{ fontWeight: 700, fontSize: 14, color: "var(--ink-soft)" }}>{t.groupName}</label>
        <input
          value={name} onChange={(e) => setName(e.target.value)} placeholder={t.groupNamePh}
          className="f-body"
          style={{ width: "100%", marginTop: 8, padding: "12px 14px", borderRadius: 14, border: "2px solid var(--ring)", background: "transparent", color: "var(--ink)", fontSize: 15, outline: "none" }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {["🌿", "🎉", "🔥", "🦄", "🍕", "⚡"].map((em) => (
            <button key={em} onClick={() => setEmoji(em)} className="chip" style={{ padding: "8px 12px", fontSize: 18, ...(emoji === em ? { borderColor: "transparent", background: "linear-gradient(135deg, var(--pink), var(--purple))" } : {}) }}>
              {em}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="f-body" style={{ fontWeight: 700 }}>{t.maxPlayers}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => setMax(Math.max(3, max - 1))} style={{ width: 34, height: 34, borderRadius: 999, background: "var(--ring)", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={16} /></button>
          <span className="f-mono" style={{ fontSize: 18, minWidth: 24, textAlign: "center" }}>{max}</span>
          <button onClick={() => setMax(Math.min(12, max + 1))} style={{ width: 34, height: 34, borderRadius: 999, background: "var(--ring)", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={16} /></button>
        </div>
      </div>

      <div>
        <p className="f-body" style={{ fontWeight: 700, marginBottom: 10, color: "var(--ink-soft)" }}>{t.pack}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span className="chip active">👯 {t.packFriends}</span>
          {["💍", "👨‍👩‍👧", "🏢"].map((e) => (
            <span key={e} className="chip disabled">{e} {t.packSoon}</span>
          ))}
        </div>
      </div>

      <div>
        <p className="f-body" style={{ fontWeight: 700, marginBottom: 10, color: "var(--ink-soft)" }}>{t.difficulty}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {diffs.map((d, i) => (
            <button key={d} onClick={() => setDiff(i)} className={`chip ${diff === i ? "active" : ""}`}>{d}</button>
          ))}
        </div>
      </div>

      <button onClick={() => onDone(name || t.groupNamePh, emoji)} className="btn-primary f-display" style={{ padding: 18, fontSize: 17, marginTop: 8 }}>
        {t.create}
      </button>
    </div>
  );
}

function ShareScreen({ t, lang, code, groupName, groupEmoji, onContinue, toast }) {
  return (
    <div className="screen-enter" style={{ padding: "12px 24px 32px", display: "flex", flexDirection: "column", gap: 22, alignItems: "center", textAlign: "center" }}>
      <Mascot mood="excited" size={90} className="bounce" />
      <div>
        <h2 className="f-display" style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{groupEmoji} {groupName}</h2>
        <p className="f-body" style={{ color: "var(--ink-soft)", marginTop: 4 }}>{t.shareTitle}</p>
      </div>
      <div className="card pop" style={{ padding: "24px 32px", width: "100%" }}>
        <p className="f-body" style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 700, marginBottom: 10 }}>{t.roomCode}</p>
        <p className="f-mono" style={{ fontSize: 40, fontWeight: 700, letterSpacing: "0.2em", background: "linear-gradient(135deg, var(--pink), var(--purple))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{code}</p>
      </div>
      <div style={{ display: "flex", gap: 10, width: "100%" }}>
        <button onClick={() => toast(t.demoToast)} className="btn-ghost f-body" style={{ flex: 1, padding: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <LinkIcon size={16} /> {t.copyLink}
        </button>
        <button onClick={() => toast(t.demoToast)} className="btn-primary f-body" style={{ flex: 1, padding: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "linear-gradient(135deg,#25D366,#128C7E)" }}>
          <MessageCircle size={16} /> {t.shareWhatsapp}
        </button>
      </div>
      <button onClick={onContinue} className="btn-primary f-display" style={{ padding: 16, fontSize: 16, width: "100%" }}>
        {t.continueToRoom}
      </button>
    </div>
  );
}

function JoinSession({ t, onDone }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🦊");

  return (
    <div className="screen-enter" style={{ padding: "12px 24px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="card" style={{ padding: 20 }}>
        <label className="f-body" style={{ fontWeight: 700, fontSize: 14, color: "var(--ink-soft)" }}>{t.codeLabel}</label>
        <input
          value={code} onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))} placeholder={t.codePh}
          className="f-mono"
          style={{ width: "100%", marginTop: 8, padding: "14px", borderRadius: 14, border: "2px solid var(--ring)", background: "transparent", color: "var(--ink)", fontSize: 22, textAlign: "center", letterSpacing: "0.3em", outline: "none" }}
        />
      </div>
      <div className="card" style={{ padding: 20 }}>
        <label className="f-body" style={{ fontWeight: 700, fontSize: 14, color: "var(--ink-soft)" }}>{t.nickname}</label>
        <input
          value={name} onChange={(e) => setName(e.target.value)} placeholder={t.nicknamePh}
          className="f-body"
          style={{ width: "100%", marginTop: 8, padding: "12px 14px", borderRadius: 14, border: "2px solid var(--ring)", background: "transparent", color: "var(--ink)", fontSize: 15, outline: "none" }}
        />
      </div>
      <div>
        <p className="f-body" style={{ fontWeight: 700, marginBottom: 10, color: "var(--ink-soft)" }}>{t.pickAvatar}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {AVATARS.map((em) => (
            <button key={em} onClick={() => setEmoji(em)} className="chip" style={{ padding: "10px 13px", fontSize: 19, ...(emoji === em ? { borderColor: "transparent", background: "linear-gradient(135deg, var(--pink), var(--purple))" } : {}) }}>
              {em}
            </button>
          ))}
        </div>
      </div>
      <button
        disabled={code.length < 4 || !name}
        onClick={() => onDone(name, emoji)}
        className="btn-primary f-display" style={{ padding: 18, fontSize: 17, marginTop: 8 }}
      >
        {t.joinBtn}
      </button>
    </div>
  );
}

function WaitingRoom({ t, lang, isHost, players, onStart }) {
  const [msgIdx, setMsgIdx] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setMsgIdx((i) => (i + 1) % t.loadingMsgs.length), 2400);
    return () => clearInterval(iv);
  }, [t]);

  return (
    <div className="screen-enter" style={{ padding: "12px 24px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ textAlign: "center" }}>
        <Mascot mood="wink" size={70} className="bounce" />
        <p key={msgIdx} className="pop f-body" style={{ marginTop: 10, color: "var(--ink-soft)", fontWeight: 600, minHeight: 40 }}>
          {t.loadingMsgs[msgIdx]}
        </p>
      </div>

      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Users size={18} />
          <span className="f-body" style={{ fontWeight: 700 }}>{players.length} {t.playersJoined}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {players.map((p, i) => (
            <div key={p.id} className="pop" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, animationDelay: `${i * 0.05}s` }}>
              <div style={{ width: 54, height: 54, borderRadius: 999, background: "var(--ring)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
                {p.emoji}
              </div>
              <span className="f-body" style={{ fontSize: 12, fontWeight: 700 }}>{lang === "ar" ? p.ar : p.en}</span>
            </div>
          ))}
        </div>
      </div>

      {isHost ? (
        <button disabled={players.length < 2} onClick={onStart} className="btn-primary f-display" style={{ padding: 18, fontSize: 17 }}>
          {t.startGame}
        </button>
      ) : (
        <div className="btn-ghost f-display" style={{ padding: 18, fontSize: 15, textAlign: "center", opacity: 0.7 }}>
          {t.waitingHost}
        </div>
      )}
    </div>
  );
}

function Round1({ t, lang, onFinish }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const q = ROUND1[idx];

  const pick = (i) => {
    setSelected(i);
    setTimeout(() => {
      if (idx + 1 < ROUND1.length) { setIdx(idx + 1); setSelected(null); }
      else onFinish();
    }, 420);
  };

  return (
    <div className="screen-enter" style={{ padding: "12px 24px 32px" }}>
      <div key={idx} className="card pop" style={{ padding: 26, textAlign: "center" }}>
        <p className="f-body" style={{ color: "var(--ink-soft)", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
          {idx + 1} / {ROUND1.length}
        </p>
        <h3 className="f-display" style={{ fontSize: 24, fontWeight: 800, margin: "10px 0 26px" }}>
          {lang === "ar" ? q.ar : q.en}
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {q.opts.map((o, i) => (
            <button
              key={i} onClick={() => pick(i)}
              className="wiggle"
              style={{
                padding: "20px 10px", borderRadius: 20, border: "2px solid var(--ring)",
                background: selected === i ? "linear-gradient(135deg, var(--pink), var(--purple))" : "var(--card)",
                color: selected === i ? "white" : "var(--ink)",
                display: "flex", flexDirection: "column", gap: 8, alignItems: "center",
                boxShadow: "0 6px 16px var(--ring)",
              }}
            >
              <span style={{ fontSize: 30 }}>{o.e}</span>
              <span className="f-body" style={{ fontWeight: 700, fontSize: 13 }}>{lang === "ar" ? o.ar : o.en}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Round2({ t, lang, players, onFinish }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const q = ROUND2[idx];

  const pick = (id) => {
    setSelected(id);
    setTimeout(() => {
      if (idx + 1 < ROUND2.length) { setIdx(idx + 1); setSelected(null); }
      else onFinish();
    }, 420);
  };

  return (
    <div className="screen-enter" style={{ padding: "12px 24px 32px" }}>
      <div key={idx} className="card pop" style={{ padding: 26, textAlign: "center" }}>
        <p className="f-body" style={{ color: "var(--ink-soft)", fontWeight: 700, fontSize: 13 }}>{idx + 1} / {ROUND2.length}</p>
        <p className="f-body" style={{ color: "var(--ink-soft)", fontWeight: 700, marginTop: 6 }}>{t.round2Sub}</p>
        <h3 className="f-display" style={{ fontSize: 22, fontWeight: 800, margin: "8px 0 24px" }}>
          {lang === "ar" ? q.ar : q.en}
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {players.map((p) => (
            <button
              key={p.id} onClick={() => pick(p.id)} className="wiggle"
              style={{
                padding: "14px 6px", borderRadius: 18, border: "2px solid var(--ring)",
                background: selected === p.id ? "linear-gradient(135deg, var(--pink), var(--purple))" : "var(--card)",
                color: selected === p.id ? "white" : "var(--ink)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              }}
            >
              <span style={{ fontSize: 24 }}>{p.emoji}</span>
              <span className="f-body" style={{ fontSize: 11, fontWeight: 700 }}>{lang === "ar" ? p.ar : p.en}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Round3({ t, lang, onFinish }) {
  const [idx, setIdx] = useState(0);
  const [guess, setGuess] = useState(50);
  const [revealed, setRevealed] = useState(false);
  const item = ROUND3[idx];
  const diff = Math.abs(guess - item.actual);

  const next = () => {
    if (idx + 1 < ROUND3.length) { setIdx(idx + 1); setGuess(50); setRevealed(false); }
    else onFinish();
  };

  return (
    <div className="screen-enter" style={{ padding: "12px 24px 32px" }}>
      <div key={idx} className="card pop" style={{ padding: 26 }}>
        <p className="f-body" style={{ color: "var(--ink-soft)", fontWeight: 700, fontSize: 13, textAlign: "center" }}>{idx + 1} / {ROUND3.length}</p>
        <h3 className="f-display" style={{ fontSize: 19, fontWeight: 800, margin: "10px 0 22px", textAlign: "center" }}>
          {lang === "ar" ? `كم ٪ من ${item.ar}؟` : `What % ${item.en}?`}
        </h3>

        <p className="f-mono" style={{ fontSize: 44, textAlign: "center", fontWeight: 700, color: "var(--pink)" }}>{guess}%</p>
        <input
          type="range" min={0} max={100} value={guess} disabled={revealed}
          onChange={(e) => setGuess(Number(e.target.value))}
          style={{ width: "100%" }}
        />

        {revealed && (
          <div className="pop" style={{ marginTop: 20, textAlign: "center" }}>
            <p className="f-body" style={{ color: "var(--ink-soft)", fontWeight: 700 }}>{t.actualWas}</p>
            <p className="f-mono" style={{ fontSize: 34, fontWeight: 700, color: "var(--mint)" }}><CountUp to={item.actual} suffix="%" /></p>
            <p className="f-body" style={{ fontWeight: 700, marginTop: 4 }}>{diff <= 12 ? t.closeGuess : t.farGuess}</p>
          </div>
        )}

        <button
          onClick={() => (revealed ? next() : setRevealed(true))}
          className="btn-primary f-display" style={{ padding: 16, fontSize: 16, width: "100%", marginTop: 22 }}
        >
          {revealed ? (idx + 1 < ROUND3.length ? t.next : t.finish) : t.reveal}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------ RESULTS (STORY) ------------------------------ */

function Results({ t, lang, groupEmoji, groupName, onRestart, toast }) {
  const [slide, setSlide] = useState(0);
  const bg = ["var(--purple)", "var(--pink)", "var(--yellow)", "var(--mint)", "var(--purple)", "var(--pink)", "var(--yellow)", "var(--mint)", "var(--purple)"];
  const total = 9;

  const nextSlide = () => setSlide((s) => Math.min(s + 1, total - 1));
  const prevSlide = () => setSlide((s) => Math.max(s - 1, 0));
  const isDark = ["var(--purple)", "var(--pink)"].includes(bg[slide]);

  return (
    <div style={{ position: "fixed", inset: 0, background: bg[slide], transition: "background .5s ease", zIndex: 10, display: "flex", flexDirection: "column", color: "white", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 6, padding: "16px 16px 0" }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className="story-seg"><div className="story-seg-fill" style={{ width: i < slide ? "100%" : i === slide ? "100%" : "0%", transition: "width .3s" }} /></div>
        ))}
      </div>

      <div style={{ position: "absolute", inset: 0, top: 30 }}>
        <div style={{ position: "absolute", inset: 0, insetInlineStart: 0, width: "35%" }} onClick={prevSlide} />
        <div style={{ position: "absolute", inset: 0, insetInlineEnd: 0, width: "65%" }} onClick={nextSlide} />
      </div>

      <div key={slide} className="pop" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 30px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        {slide === 0 && (
          <>
            <Mascot mood="excited" size={100} className="bounce" />
            <h2 className="f-display" style={{ fontSize: 30, fontWeight: 800, marginTop: 20 }}>{t.resultsIntro1}</h2>
            <p className="f-body" style={{ fontSize: 17, marginTop: 8, opacity: 0.9 }}>{t.resultsIntro2}</p>
            <button onClick={nextSlide} className="f-display" style={{ marginTop: 30, background: "white", color: "var(--purple)", padding: "14px 30px", borderRadius: 999, fontWeight: 800, fontSize: 15 }}>
              {t.viewResults}
            </button>
          </>
        )}

        {slide === 1 && (
          <>
            <p className="f-body" style={{ fontWeight: 700, opacity: 0.85, marginBottom: 6 }}>{groupEmoji} {groupName}</p>
            <h2 className="f-display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>{t.yourPersonality}</h2>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <RadarChart data={RADAR_STATS.map((r) => ({ subject: lang === "ar" ? r.ar : r.en, val: r.v }))} outerRadius="75%">
                  <PolarGrid stroke="rgba(255,255,255,0.35)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "white", fontSize: 11, fontWeight: 700 }} />
                  <Radar dataKey="val" stroke="white" fill="white" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {slide === 2 && (
          <>
            <Confetti seed={2} />
            <p className="f-body" style={{ fontWeight: 700, opacity: 0.85 }}>{t.topAward}</p>
            <span style={{ fontSize: 70, marginTop: 10 }}>{AWARDS[0].e}</span>
            <h2 className="f-display" style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{lang === "ar" ? AWARDS[0].ar : AWARDS[0].en}</h2>
          </>
        )}

        {slide === 3 && (
          <>
            <h2 className="f-display" style={{ fontSize: 22, fontWeight: 800, marginBottom: 18 }}>{t.moreAwards}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%" }}>
              {AWARDS.slice(1, 5).map((a, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 18, padding: "16px 8px" }}>
                  <div style={{ fontSize: 30 }}>{a.e}</div>
                  <p className="f-body" style={{ fontSize: 12, fontWeight: 700, marginTop: 6 }}>{lang === "ar" ? a.ar : a.en}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {slide === 4 && (
          <>
            <p className="f-body" style={{ fontWeight: 700, opacity: 0.85 }}>{t.bestFriend}</p>
            <div style={{ display: "flex", marginTop: 16 }}>
              <span style={{ fontSize: 50 }}>🌿</span>
              <span style={{ fontSize: 50, marginInlineStart: -14 }}>🦊</span>
            </div>
            <h2 className="f-display" style={{ fontSize: 40, fontWeight: 800, marginTop: 10 }}><CountUp to={89} suffix="%" /></h2>
            <p className="f-body" style={{ opacity: 0.85, marginTop: 4 }}>{t.friendshipMatch} — {t.you} × {lang === "ar" ? "سارة" : "Sara"}</p>
            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap", justifyContent: "center" }}>
              {(lang === "ar" ? ["قهوة", "سفر", "أفلام رعب"] : ["Coffee", "Travel", "Horror movies"]).map((s) => (
                <span key={s} style={{ background: "rgba(255,255,255,0.2)", padding: "6px 14px", borderRadius: 999, fontSize: 13, fontWeight: 700 }}>{s}</span>
              ))}
            </div>
          </>
        )}

        {(slide === 5 || slide === 6) && (
          <>
            <h2 className="f-display" style={{ fontSize: 56, fontWeight: 800 }}><CountUp to={HIDDEN_STATS[slide - 5].n} suffix="%" /></h2>
            <p className="f-body" style={{ fontSize: 16, marginTop: 10, maxWidth: 280 }}>
              {lang === "ar" ? HIDDEN_STATS[slide - 5].ar : HIDDEN_STATS[slide - 5].en}
            </p>
          </>
        )}

        {slide === 7 && (
          <>
            <Mascot mood="happy" size={70} />
            <h2 className="f-display" style={{ fontSize: 20, fontWeight: 800, margin: "14px 0 10px" }}>{t.personalSummary}</h2>
            <p className="f-body" style={{ fontSize: 15, lineHeight: 1.8, opacity: 0.95 }}>{SUMMARY[lang]}</p>
          </>
        )}

        {slide === 8 && (
          <>
            <div className="card" style={{ background: "white", color: "var(--ink)", padding: 24, width: "100%", borderRadius: 24 }}>
              <p className="f-body" style={{ fontWeight: 700, color: "var(--ink-soft)", fontSize: 12 }}>{groupEmoji} {groupName}</p>
              <h3 className="f-display" style={{ fontSize: 22, fontWeight: 800, margin: "6px 0" }}>{t.shareCard}</h3>
              <span style={{ fontSize: 44 }}>{AWARDS[0].e}</span>
              <p className="f-body" style={{ fontWeight: 700 }}>{lang === "ar" ? AWARDS[0].ar : AWARDS[0].en}</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%", marginTop: 18 }}>
              {[
                { icon: Download, label: t.downloadImg },
                { icon: Share2, label: t.igStory },
                { icon: MessageCircle, label: t.whatsapp },
                { icon: Sparkles, label: t.snap },
              ].map(({ icon: Icon, label }) => (
                <button key={label} onClick={() => toast(t.demoToast)} style={{ background: "rgba(255,255,255,0.2)", borderRadius: 16, padding: "12px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <Icon size={18} />
                  <span className="f-body" style={{ fontSize: 11, fontWeight: 700 }}>{label}</span>
                </button>
              ))}
            </div>
            <button onClick={onRestart} className="f-display" style={{ marginTop: 18, background: "white", color: "var(--purple)", padding: "14px 30px", borderRadius: 999, fontWeight: 800, fontSize: 15 }}>
              {t.backHome}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* --------------------------------- APP ROOT --------------------------------- */

export default function BagdoonisApp() {
  const [lang, setLang] = useState("ar");
  const [dark, setDark] = useState(false);
  const [screen, setScreen] = useState("home");
  const [isHost, setIsHost] = useState(true);
  const [code, setCode] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupEmoji, setGroupEmoji] = useState("🌿");
  const [players, setPlayers] = useState([{ id: "you", ar: "أنت", en: "You", emoji: "🌿" }]);
  const [toastMsg, setToastMsg] = useState(null);
  const timerRef = useRef(null);
  const t = STR[lang];

  useEffect(() => { document.body.style.background = dark ? "#140F29" : "#FFFDF7"; }, [dark]);

  const toast = (msg) => {
    setToastMsg(msg);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToastMsg(null), 2200);
  };

  const go = (s) => setScreen(s);

  const handleCreateDone = (name, emoji) => {
    setGroupName(name); setGroupEmoji(emoji); setCode(genCode()); setIsHost(true);
    setPlayers([{ id: "you", ar: "أنت", en: "You", emoji }]);
    setScreen("created");
  };

  const goWaitingAsHost = () => {
    setScreen("waiting");
    let i = 0;
    const iv = setInterval(() => {
      setPlayers((prev) => {
        if (i >= PLAYER_POOL.length) { clearInterval(iv); return prev; }
        const np = [...prev, PLAYER_POOL[i]];
        i++;
        return np;
      });
    }, 900);
  };

  const handleJoinDone = (name, emoji) => {
    setIsHost(false);
    setGroupName(lang === "ar" ? "شلة الحي" : "The Crew");
    setGroupEmoji("🌿");
    setPlayers([
      { id: "you", ar: name || t.you, en: name || t.you, emoji },
      PLAYER_POOL[0], PLAYER_POOL[1],
    ]);
    setScreen("waiting");
  };

  const startGame = () => setScreen("round1");
  const restart = () => {
    setScreen("home"); setPlayers([{ id: "you", ar: "أنت", en: "You", emoji: "🌿" }]);
  };

  const titles = {
    create: t.createTitle, created: t.shareTitle, join: t.joinTitle, waiting: t.waitingTitle,
    round1: t.round1Title, round2: t.round2Title, round3: t.round3Title,
  };

  return (
    <div className={`bagdoonis-root ${dark ? "dark" : ""}`} dir={t.dir}>
      <GlobalStyle />
      {screen !== "results" && <Blobs />}
      <div className="stage">
        {screen !== "home" && screen !== "results" && (
          <TopBar
            t={t} lang={lang} setLang={setLang} dark={dark} setDark={setDark}
            onBack={() => go("home")} title={titles[screen]}
            progress={
              screen === "round1" ? undefined :
              screen === "round2" ? undefined :
              undefined
            }
          />
        )}

        {screen === "home" && <Home t={t} lang={lang} setLang={setLang} dark={dark} setDark={setDark} go={go} />}
        {screen === "create" && <CreateSession t={t} lang={lang} onDone={handleCreateDone} />}
        {screen === "created" && <ShareScreen t={t} lang={lang} code={code} groupName={groupName} groupEmoji={groupEmoji} onContinue={goWaitingAsHost} toast={toast} />}
        {screen === "join" && <JoinSession t={t} onDone={handleJoinDone} />}
        {screen === "waiting" && <WaitingRoom t={t} lang={lang} isHost={isHost} players={players} onStart={startGame} />}
        {screen === "round1" && <Round1 t={t} lang={lang} onFinish={() => go("round2")} />}
        {screen === "round2" && <Round2 t={t} lang={lang} players={players} onFinish={() => go("round3")} />}
        {screen === "round3" && <Round3 t={t} lang={lang} onFinish={() => go("results")} />}
      </div>

      {screen === "results" && <Results t={t} lang={lang} groupEmoji={groupEmoji} groupName={groupName || (lang === "ar" ? "شلة الحي" : "The Crew")} onRestart={restart} toast={toast} />}

      {toastMsg && <div className="toast">{toastMsg}</div>}
    </div>
  );
}
