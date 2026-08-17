/**
 * All the actual writing for وش وضعك lives here. Four rounds now, matching
 * فشلة's real round shapes and reusing its actual seeded question content
 * for rounds 1/3/4 (verbatim from supabase/seed.sql, pack "friends") —
 * same questions, same shuffle-and-pick-N approach, just solo instead of
 * multiplayer and trimmed to fewer per round. Round 2 is the original
 * scenario-question set this game launched with, trimmed from 8 to 4.
 *
 * Deliberately Arabic-only — culturally-specific humor, not meant to be
 * translated.
 */

export type Dimension = "spontaneity" | "overthinking" | "comfort" | "recklessness" | "drama" | "control";

export const DIMENSION_LABELS: Record<Dimension, string> = {
  spontaneity: "العفوية",
  overthinking: "التفكير الزايد",
  comfort: "حب الراحة",
  recklessness: "التهور",
  drama: "الدراما",
  control: "حب التحكم",
};

export type Option = {
  id: string;
  text: string;
  emoji?: string;
  weights: Partial<Record<Dimension, number>>;
};

export type Question = {
  id: string;
  prompt: string;
  options: Option[];
};

// ---------------------------------------------------------------------------
// Round 1 — real فشلة "self" trait questions (seed.sql, round=1). Emoji
// multiple-choice, shuffled and trimmed to 4 of the real pool.
// ---------------------------------------------------------------------------
export const ROUND1_POOL: Question[] = [
  {
    id: "r1_mood", prompt: "مودي غالبًا…",
    options: [
      { id: "a", emoji: "😂", text: "أضحك", weights: { spontaneity: 2 } },
      { id: "b", emoji: "🤔", text: "أفكر زيادة", weights: { overthinking: 2 } },
      { id: "c", emoji: "😌", text: "مرتاح", weights: { comfort: 2 } },
      { id: "d", emoji: "🎭", text: "درامي", weights: { drama: 2 } },
    ],
  },
  {
    id: "r1_mornings", prompt: "صباحاتي…",
    options: [
      { id: "a", emoji: "⏰", text: "أصحى بدري", weights: { control: 2 } },
      { id: "b", emoji: "😴", text: "أأجل المنبه للأبد", weights: { comfort: 2 } },
      { id: "c", emoji: "🎶", text: "المنبه يقلب DJ بالحلم", weights: { spontaneity: 2 } },
      { id: "d", emoji: "🤷", text: "ما أتذكر إني صحيت", weights: { spontaneity: 2 } },
    ],
  },
  {
    id: "r1_groupchats", prompt: "بقروبات الواتساب أنا…",
    options: [
      { id: "a", emoji: "⚡", text: "أرد فوراً", weights: { recklessness: 2 } },
      { id: "b", emoji: "👀", text: "أقرا واسكت", weights: { overthinking: 2 } },
      { id: "c", emoji: "🎙️", text: "أرسل ١٠ فويس", weights: { drama: 2 } },
      { id: "d", emoji: "🔕", text: "أصمت كل شي", weights: { comfort: 2 } },
    ],
  },
  {
    id: "r1_exams", prompt: "الاختبارات أنا…",
    options: [
      { id: "a", emoji: "📚", text: "أذاكر من أسابيع", weights: { control: 2 } },
      { id: "b", emoji: "🌙", text: "أذاكر آخر ليلة", weights: { spontaneity: 2 } },
      { id: "c", emoji: "🎲", text: "أرتجل", weights: { recklessness: 2 } },
      { id: "d", emoji: "🔍", text: "أبرشم كل شي", weights: { overthinking: 2 } },
    ],
  },
  {
    id: "r1_room", prompt: "غرفتي…",
    options: [
      { id: "a", emoji: "✨", text: "نظيفة ومرتبة", weights: { control: 2 } },
      { id: "b", emoji: "📦", text: "فوضى منظمة", weights: { comfort: 2 } },
      { id: "c", emoji: "🌪️", text: "منطقة كوارث", weights: { recklessness: 2 } },
      { id: "d", emoji: "🖼️", text: "شكلها حلو بس فيها خبايا", weights: { drama: 2 } },
    ],
  },
  {
    id: "r1_weekend", prompt: "خطط الويكند…",
    options: [
      { id: "a", emoji: "🗓️", text: "جدول مليان", weights: { control: 1, overthinking: 1 } },
      { id: "b", emoji: "🎲", text: "قرار اللحظة الأخيرة", weights: { spontaneity: 2 } },
      { id: "c", emoji: "🛏️", text: "أقعد بالسرير", weights: { comfort: 2 } },
      { id: "d", emoji: "🤝", text: "أي شي يقرره القروب", weights: { drama: 1, comfort: 1 } },
    ],
  },
];

// ---------------------------------------------------------------------------
// Round 2 — the original scenario questions, trimmed from 8 to the 4 that
// give the widest dimension spread.
// ---------------------------------------------------------------------------
export const ROUND2_QUESTIONS: Question[] = [
  {
    id: "q1",
    prompt: "أصحابك طلعوا بدون ما يعزمونك. وش تسوي؟",
    options: [
      { id: "a", text: "أقول عادي وأكمل يومي", weights: { comfort: 2 } },
      { id: "b", text: "أشوف الستوري وأحقق مين كان معهم 👀", weights: { overthinking: 2, drama: 1 } },
      { id: "c", text: "أواجههم وأقول ليش ما عزمتوني", weights: { recklessness: 2, drama: 1 } },
      { id: "d", text: "أنزل ستوري وأنا طالع مع ناس ثانية 😂", weights: { drama: 2, spontaneity: 1 } },
    ],
  },
  {
    id: "q3",
    prompt: "صديقك سألك رايك بلبس جديد، وأنت شايفه مو حلو. وش تقول؟",
    options: [
      { id: "a", text: "أقول الحق بصراحة تامة، حتى لو زعل", weights: { recklessness: 2, control: 1 } },
      { id: "b", text: "أفكر كثير كيف أقولها بطريقة لطيفة", weights: { overthinking: 2 } },
      { id: "c", text: "أقول \"حلو\" وأنا مو مقتنع، عشان الموقف يعدي", weights: { comfort: 2 } },
      { id: "d", text: "أغير الموضوع بذكاء وأتجنب الجواب المباشر", weights: { spontaneity: 2, overthinking: 1 } },
    ],
  },
  {
    id: "q6",
    prompt: "شفت شخص يسبك وهو ما يدري إنك سامعه. وش تسوي؟",
    options: [
      { id: "a", text: "أتجاهل الموضوع، مب مستاهل طاقتي", weights: { comfort: 2 } },
      { id: "b", text: "أواجهه على طول قدام الكل", weights: { recklessness: 2, drama: 1 } },
      { id: "c", text: "أخطط كيف أرد عليه بطريقة ذكية بعدين", weights: { control: 2, overthinking: 1 } },
      { id: "d", text: "أسولف لأصحابي عن الموضوع وأسوي منه حدث", weights: { drama: 2 } },
    ],
  },
  {
    id: "q8",
    prompt: "صديق قالك \"خلاص ما ودي أكلمك بعد اليوم\" بدون سبب واضح. وش ردة فعلك؟",
    options: [
      { id: "a", text: "أسأله وش صار بهدوء وأحاول أفهم", weights: { overthinking: 2 } },
      { id: "b", text: "أقول \"تمام\" وأكمل حياتي بدون دراما", weights: { comfort: 2, control: 1 } },
      { id: "c", text: "أصير مهووس أفكر وش سويت غلط", weights: { overthinking: 2, drama: 1 } },
      { id: "d", text: "أرد بنفس الطاقة وأقول \"ولا يهمك\"", weights: { recklessness: 2, spontaneity: 1 } },
    ],
  },
];

// ---------------------------------------------------------------------------
// Round 3 — real فشلة hot takes (seed.sql, round=3). Agree/disagree, 3 of
// the real pool, shuffled. Stance-to-dimension mapping is judgment-based
// (hot takes don't come with built-in trait weights the way round 1 does).
// ---------------------------------------------------------------------------
export const ROUND3_POOL: (Question & { emoji: string })[] = [
  {
    id: "r3_pizza", emoji: "🍍",
    prompt: "الأناناس مكانه على البيتزا",
    options: [
      { id: "agree", text: "أوافق", weights: { spontaneity: 2 } },
      { id: "disagree", text: "ما أوافق", weights: { control: 1 } },
    ],
  },
  {
    id: "r3_like", emoji: "📱",
    prompt: "اللايك على الستوري مو تواصل حقيقي",
    options: [
      { id: "agree", text: "أوافق", weights: { overthinking: 2 } },
      { id: "disagree", text: "ما أوافق", weights: { comfort: 2 } },
    ],
  },
  {
    id: "r3_dontcare", emoji: "🧢",
    prompt: "كل شخص يقول \"ما يهمني رأي الناس\" هو أكثر وحد يهمه رأي الناس",
    options: [
      { id: "agree", text: "أوافق", weights: { overthinking: 2, drama: 1 } },
      { id: "disagree", text: "ما أوافق", weights: { comfort: 1, control: 1 } },
    ],
  },
  {
    id: "r3_slow_walkers", emoji: "🐌",
    prompt: "اللي يمشون ببطء بمجموعة لازم يتغرمون",
    options: [
      { id: "agree", text: "أوافق", weights: { recklessness: 2, drama: 1 } },
      { id: "disagree", text: "ما أوافق", weights: { comfort: 2 } },
    ],
  },
  {
    id: "r3_selfie", emoji: "🤳",
    prompt: "إذا أخذت أكثر من ٣ سيلفي قبل ما تنشر وحدة، فأنت غير واثق من نفسك",
    options: [
      { id: "agree", text: "أوافق", weights: { control: 1, recklessness: 1 } },
      { id: "disagree", text: "ما أوافق", weights: { overthinking: 1, comfort: 1 } },
    ],
  },
];

// ---------------------------------------------------------------------------
// Round 4 — real فشلة would-you-rathers (seed.sql, round=4, this_or_that).
// ---------------------------------------------------------------------------
export const ROUND4_POOL: Question[] = [
  {
    id: "r4_powers",
    prompt: "لو عندك قوة خارقة وش تختار؟",
    options: [
      { id: "a", emoji: "✈️", text: "قوة الطيران", weights: { recklessness: 1, spontaneity: 1 } },
      { id: "b", emoji: "👻", text: "قوة الاختفاء", weights: { overthinking: 2 } },
    ],
  },
  {
    id: "r4_offline",
    prompt: "وش تختار؟",
    options: [
      { id: "a", emoji: "📵", text: "بدون سوشال ميديا للأبد", weights: { comfort: 2 } },
      { id: "b", emoji: "🎬", text: "بدون أفلام ومسلسلات للأبد", weights: { drama: 1, spontaneity: 1 } },
    ],
  },
  {
    id: "r4_timing",
    prompt: "وش تختار؟",
    options: [
      { id: "a", emoji: "⏰", text: "دايم متأخر ١٠ دقايق", weights: { spontaneity: 2 } },
      { id: "b", emoji: "⏳", text: "دايم مبكر ٣٠ دقيقة", weights: { control: 2 } },
    ],
  },
  {
    id: "r4_money_friends",
    prompt: "وش تختار؟",
    options: [
      { id: "a", emoji: "💰", text: "فلوس بلا حدود بدون أصحاب", weights: { recklessness: 1, control: 1 } },
      { id: "b", emoji: "👯", text: "أصحاب بلا حدود بدون فلوس", weights: { comfort: 1, drama: 1 } },
    ],
  },
];

/** Shown after each round completes, not mid-round — keyed by the
 *  absolute question number that ends each round (4, 8, 11, 15 across
 *  the 4+4+3+4 structure). */
export const REACTION_AFTER_QUESTION: Record<number, string[]> = {
  4: ["أوكي… سجلناها عليك.", "همم. تمام."],
  8: ["اختيار مثير للاهتمام 💀", "ملاحظة صغيرة، وبس."],
  11: ["واضح إن عندنا وضع هنا.", "أنت متأكد من إجاباتك؟ 👀"],
  15: ["تم. عندنا صورة واضحة الحين.", "أوكي، هذا يفسر أشياء كثيرة."],
};

export type Archetype = {
  key: string;
  name: string;
  emoji: string;
  primary: Dimension;
  secondary: Dimension;
  description: string;
  strengths: string[];
  flaw: string;
  truth: string;
  cardLine: string;
};

export const ARCHETYPES: Archetype[] = [
  {
    key: "ceo", name: "الرئيس التنفيذي", emoji: "👑", primary: "control", secondary: "recklessness",
    description: "أنت تحب تكون القائد… المشكلة إن المنصب مو موجود 😂 عندك ثقة عالية بقراراتك، حتى القرارات اللي اتخذتها قبل لا تفكر فيها أصلًا.",
    strengths: ["تتحمل المسؤولية بدون ما تشتكي", "قراراتك سريعة، محد ينتظرك"],
    flaw: "تحب تتحكم بكل شي، حتى الأشياء اللي مو شغلك أصلًا.",
    truth: "مو كل موقف يحتاج قائد. بعضها بس يحتاج واحد يسكت.",
    cardLine: "يدير حياته زي شركة… ناقصه بس الموظفين",
  },
  {
    key: "planner", name: "المخطط الاستراتيجي", emoji: "📊", primary: "control", secondary: "overthinking",
    description: "عندك خطة A وB وC حتى لأشياء ما تحتاج خطة أصلًا. الفوضى تخوفك أكثر من أي شي ثاني، وأي تغيير بآخر لحظة يهد نفسيتك شوي.",
    strengths: ["منظم لدرجة يحسدونك عليها", "دايم عنده حل احتياطي جاهز"],
    flaw: "أول ما الخطة تتغير، تحس الدنيا وقفت.",
    truth: "مرة وحدة، جرب تسوي شي بدون خطة. ما راح تموت.",
    cardLine: "عنده جدول لجدول الجدول",
  },
  {
    key: "detective", name: "المحقق", emoji: "🕵️", primary: "overthinking", secondary: "drama",
    description: "ستوري واحدة تكفيك تبني عليها قصة كاملة. تحلل كل رسالة، كل تأخير بالرد، كل \"شفت\" بدون رد. القضية دايم مفتوحة عندك.",
    strengths: ["تلاحظ أشياء محد يلاحظها", "صديق وفي، يدافع عنك بشراسة"],
    flaw: "تسوي من الحبة قبة، وأكثر الأدلة مبنية على توقعات بس.",
    truth: "مو كل شي له سبب خفي. أحيانًا الشخص بس كان مشغول.",
    cardLine: "يحقق بقضايا محد رفع بلاغ فيها",
  },
  {
    key: "encyclopedia", name: "الموسوعة المتحركة", emoji: "🧠", primary: "overthinking", secondary: "comfort",
    description: "تفكر بكل شي، بس من مكانك. تحلل المواقف بعمق وتوصل لنتايج ذكية، بس تطبيقها؟ هذا شغل يوم ثاني.",
    strengths: ["تحليلك عميق ودقيق", "نصايحك دايم صح، حتى لو ما تسويها بنفسك"],
    flaw: "تعرف الحل، بس تتكاسل تنفذه.",
    truth: "التفكير بدون تنفيذ اسمه تسويف، مو حكمة.",
    cardLine: "يعرف كل شي، يسوي ولا شي",
  },
  {
    key: "rebel", name: "المتمرد", emoji: "😈", primary: "recklessness", secondary: "spontaneity",
    description: "القوانين عندك اقتراحات، مو أوامر. تسوي اللي يحلالك، ويوم الناس يقولون \"مايصير\"، هذا بالضبط اللي يخليك تسويه.",
    strengths: ["ما تخاف تجرب أشياء جديدة", "صريح، محد يشك بنواياك"],
    flaw: "أحيانًا تسوي اللي يحلالك بدون ما تفكر بعواقبه.",
    truth: "الحرية الحقيقية إنك تختار متى تتمرد، مو إنك تتمرد كل وقت.",
    cardLine: "يقرا القوانين... عشان يعرف كيف يكسرها",
  },
  {
    key: "bold", name: "المتهور الواثق", emoji: "🔥", primary: "recklessness", secondary: "control",
    description: "تاخذ قرارات بثانية وتمشي فيها بثقة تامة، صح كانت أو غلط. الشك مو من قاموسك، حتى لو طلعت النتيجة كارثة.",
    strengths: ["ثقتك تنقل للي حولك", "ما تضيع وقت بالتردد"],
    flaw: "الثقة بدون تفكير اسمها مخاطرة، مو شجاعة.",
    truth: "مرة بالعمر، فكر ثانية وحدة زيادة قبل لا تقرر.",
    cardLine: "يتدخل أول، ويسأل وش صار بعدين",
  },
  {
    key: "comfort_king", name: "راعي الراحة", emoji: "🛋️", primary: "comfort", secondary: "overthinking",
    description: "أي مجهود زيادة عن اللازم؟ لا شكرًا. تفضل الحل الأسهل دايمًا، حتى لو كان فيه حل أفضل يحتاج شوي تعب.",
    strengths: ["هادئ، ما يدخل بدراما محد يبيها", "يعرف يحافظ على طاقته"],
    flaw: "أحيانًا الراحة تتحول لعذر عشان ما تسوي اللي لازم تسويه.",
    truth: "الراحة حلوة، بس مو كل شي بالحياة يجي وأنت مستلقي.",
    cardLine: "طاقته محفوظة... من سنة ٢٠١٩",
  },
  {
    key: "whatever", name: "ما تفرق معي", emoji: "😎", primary: "comfort", secondary: "spontaneity",
    description: "كل شي عندك سهل. الخطة تتغير؟ عادي. أحد زعل؟ يعدي. الدنيا ما تستاهل توتر، وأنت آخر واحد يدخل بدراما محد يبيها.",
    strengths: ["ما تتوتر بسهولة", "الناس ترتاح وياك"],
    flaw: "أحيانًا اللامبالاة تصير تجاهل لأشياء تستاهل اهتمامك فعلًا.",
    truth: "\"ما تفرق معي\" أحيانًا بس طريقة تتجنب فيها المواجهة.",
    cardLine: "الإعدادات عنده كلها على وضع \"عادي\"",
  },
  {
    key: "drama_king", name: "ملك الدراما", emoji: "🎭", primary: "drama", secondary: "recklessness",
    description: "كل موقف عندك فيه فصل أول وثاني وثالث. لو صار شي بسيط، بيتحول عندك لحدث تاريخي يستاهل ستوري كاملة.",
    strengths: ["ما فيه ملل وياك أبدًا", "تعبر عن مشاعرك بدون ما تكبتها"],
    flaw: "أحيانًا تكبر الموضوع أكثر من حجمه الطبيعي بمراحل.",
    truth: "مو كل موقف يحتاج ٣ ستوريات وتغريدة. بعضها بس يعدي.",
    cardLine: "عنده مسلسل كامل... عن يومه العادي",
  },
  {
    key: "clown", name: "المهرج الرسمي", emoji: "🤡", primary: "spontaneity", secondary: "drama",
    description: "أي موقف، حتى لو محرج، تحوله لنكتة. الجدية مو أسلوبك، وردة فعلك الأولى دايمًا شي مضحك يخفف الموقف.",
    strengths: ["تخفف على الشلة بأي موقف", "ما تاخذ نفسك على محمل الجد كثير"],
    flaw: "أحيانًا تهرب من المواقف الجدية بالضحك بدل ما تواجهها.",
    truth: "مو كل شي لازم يكون نكتة. بعض المواقف تستاهل وقفة حقيقية.",
    cardLine: "جاهز بنكتة لأي موقف، حتى الجنازة",
  },
];
