/**
 * All the actual writing for وش وضعك lives here — questions, archetypes,
 * reactions. Pure content, no logic (scoring lives in wadak-engine.ts).
 *
 * Deliberately Arabic-only, unlike the rest of the site's ar/en toggle.
 * Every line here is written to be funny specifically in Saudi/Khaliji
 * dialect — translating it would flatten the humor into something
 * generic, which defeats the entire point of the game. The surrounding
 * chrome (home button, etc.) still respects the site's language setting;
 * the quiz content itself doesn't.
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
  weights: Partial<Record<Dimension, number>>;
};

export type Question = {
  id: string;
  prompt: string;
  options: Option[];
};

export const QUESTIONS: Question[] = [
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
    id: "q2",
    prompt: "وصلت مطعم وحجزك ضاع. وش ردة فعلك؟",
    options: [
      { id: "a", text: "أضحك وأقول قدرها الله، أنتظر أو أطلب توصيل", weights: { comfort: 2 } },
      { id: "b", text: "أطلب أكلم المدير وأوضح الموقف بهدوء", weights: { control: 2 } },
      { id: "c", text: "أصور الموقف وأسوي منه قصة كاملة على الستوري", weights: { drama: 2, spontaneity: 1 } },
      { id: "d", text: "أطلع أدور مطعم ثاني بسرعة بدون تفكير", weights: { recklessness: 2, spontaneity: 1 } },
    ],
  },
  {
    id: "q3",
    prompt: "صديقك سألك رايك بلبس جديد، وأنت شايفه مو حلو أبد. وش تقول؟",
    options: [
      { id: "a", text: "أقول الحق بصراحة تامة، حتى لو زعل", weights: { recklessness: 2, control: 1 } },
      { id: "b", text: "أفكر كثير كيف أقولها بطريقة لطيفة", weights: { overthinking: 2 } },
      { id: "c", text: "أقول \"حلو\" وأنا مو مقتنع، عشان الموقف يعدي", weights: { comfort: 2 } },
      { id: "d", text: "أغير الموضوع بذكاء وأتجنب الجواب المباشر", weights: { spontaneity: 2, overthinking: 1 } },
    ],
  },
  {
    id: "q4",
    prompt: "جاك واتساب من رقم غريب يقول \"مين معك؟\" وش تسوي؟",
    options: [
      { id: "a", text: "أتجاهلها، مالي خلق أرد", weights: { comfort: 2 } },
      { id: "b", text: "أرد بفضول أسأل مين انت أول", weights: { overthinking: 2, drama: 1 } },
      { id: "c", text: "أرد بجواب غريب بس عشان أشوف ردة فعلهم", weights: { spontaneity: 2, drama: 1 } },
      { id: "d", text: "أحظر الرقم على طول بدون تردد", weights: { recklessness: 2, control: 1 } },
    ],
  },
  {
    id: "q5",
    prompt: "خططتوا ليوم كامل مع الشلة، وبآخر لحظة تغيرت الخطة كلها. وش تسوي؟",
    options: [
      { id: "a", text: "أتأقلم بسرعة، أي خطة تمشي عندي", weights: { spontaneity: 2 } },
      { id: "b", text: "أنزعج شوي بس أكمل يومي عادي", weights: { comfort: 1, overthinking: 1 } },
      { id: "c", text: "أبدأ أخطط للبديل فورًا وأتحكم بالموقف", weights: { control: 2 } },
      { id: "d", text: "أصير محبط وأفكر ليش دايم كذا يصير معي", weights: { overthinking: 2, drama: 1 } },
    ],
  },
  {
    id: "q6",
    prompt: "شفت شخص يتكلم عنك بالسوء وهو ما يدري إنك سامعه. وش تسوي؟",
    options: [
      { id: "a", text: "أتجاهل الموضوع، مب مستاهل طاقتي", weights: { comfort: 2 } },
      { id: "b", text: "أواجهه على طول قدام الكل", weights: { recklessness: 2, drama: 1 } },
      { id: "c", text: "أخطط كيف أرد عليه بطريقة ذكية بعدين", weights: { control: 2, overthinking: 1 } },
      { id: "d", text: "أسولف لأصحابي عن الموضوع وأسوي منه حدث", weights: { drama: 2 } },
    ],
  },
  {
    id: "q7",
    prompt: "عندك مهمة مهمة بكرة الصبح. وش تسوي الليلة؟",
    options: [
      { id: "a", text: "أنام بدري، خلاص ما فيه نقاش", weights: { control: 2 } },
      { id: "b", text: "أفكر بكل السيناريوهات اللي ممكن تصير", weights: { overthinking: 2 } },
      { id: "c", text: "أسهر عادي، بكرة الصبح أشوف وش أسوي", weights: { comfort: 2, spontaneity: 1 } },
      { id: "d", text: "أسوي كل شي إلا اللي المفروض أسويه", weights: { spontaneity: 2, recklessness: 1 } },
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

/** Shown after specific questions only (not every one) — strategic, not
 *  constant, so it stays funny instead of becoming noise. */
export const REACTION_AFTER_QUESTION: Record<number, string[]> = {
  2: ["أوكي… سجلناها عليك.", "ملاحظة صغيرة، وبس."],
  4: ["اختيار مثير للاهتمام 💀", "همم. تمام."],
  6: ["واضح إن عندنا وضع هنا.", "أنت متأكد من إجابتك؟ 👀"],
  8: ["طيب... أما كذا وضعك 😂", "خلصنا نجمع الأدلة."],
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
  cardLine: string; // short funny one-liner for the share card
};

export const ARCHETYPES: Archetype[] = [
  {
    key: "ceo",
    name: "الرئيس التنفيذي",
    emoji: "👑",
    primary: "control",
    secondary: "recklessness",
    description:
      "أنت تحب تكون القائد… المشكلة إن المنصب مو موجود 😂 عندك ثقة عالية بقراراتك، حتى القرارات اللي اتخذتها قبل لا تفكر فيها أصلًا.",
    strengths: ["تتحمل المسؤولية بدون ما تشتكي", "قراراتك سريعة، محد ينتظرك"],
    flaw: "تحب تتحكم بكل شي، حتى الأشياء اللي مو شغلك أصلًا.",
    truth: "مو كل موقف يحتاج قائد. بعضها بس يحتاج واحد يسكت.",
    cardLine: "يدير حياته زي شركة… ناقصه بس الموظفين",
  },
  {
    key: "planner",
    name: "المخطط الاستراتيجي",
    emoji: "📊",
    primary: "control",
    secondary: "overthinking",
    description:
      "عندك خطة A وB وC حتى لأشياء ما تحتاج خطة أصلًا. الفوضى تخوفك أكثر من أي شي ثاني، وأي تغيير بآخر لحظة يهد نفسيتك شوي.",
    strengths: ["منظم لدرجة يحسدونك عليها", "دايم عنده حل احتياطي جاهز"],
    flaw: "أول ما الخطة تتغير، تحس الدنيا وقفت.",
    truth: "مرة وحدة، جرب تسوي شي بدون خطة. ما راح تموت.",
    cardLine: "عنده جدول لجدول الجدول",
  },
  {
    key: "detective",
    name: "المحقق",
    emoji: "🕵️",
    primary: "overthinking",
    secondary: "drama",
    description:
      "ستوري واحدة تكفيك تبني عليها قصة كاملة. تحلل كل رسالة، كل تأخير بالرد، كل \"شفت\" بدون رد. القضية دايم مفتوحة عندك.",
    strengths: ["تلاحظ أشياء محد يلاحظها", "صديق وفي، يدافع عنك بشراسة"],
    flaw: "تسوي من الحبة قبة، وأكثر الأدلة مبنية على توقعات بس.",
    truth: "مو كل شي له سبب خفي. أحيانًا الشخص بس كان مشغول.",
    cardLine: "يحقق بقضايا محد رفع بلاغ فيها",
  },
  {
    key: "encyclopedia",
    name: "الموسوعة المتحركة",
    emoji: "🧠",
    primary: "overthinking",
    secondary: "comfort",
    description:
      "تفكر بكل شي، بس من مكانك. تحلل المواقف بعمق وتوصل لنتايج ذكية، بس تطبيقها؟ هذا شغل يوم ثاني.",
    strengths: ["تحليلك عميق ودقيق", "نصايحك دايم صح، حتى لو ما تسويها بنفسك"],
    flaw: "تعرف الحل، بس تتكاسل تنفذه.",
    truth: "التفكير بدون تنفيذ اسمه تسويف، مو حكمة.",
    cardLine: "يعرف كل شي، يسوي ولا شي",
  },
  {
    key: "rebel",
    name: "المتمرد",
    emoji: "😈",
    primary: "recklessness",
    secondary: "spontaneity",
    description:
      "القوانين عندك اقتراحات، مو أوامر. تسوي اللي يحلالك، ويوم الناس يقولون \"مايصير\"، هذا بالضبط اللي يخليك تسويه.",
    strengths: ["ما تخاف تجرب أشياء جديدة", "صريح، محد يشك بنواياك"],
    flaw: "أحيانًا تسوي اللي يحلالك بدون ما تفكر بعواقبه.",
    truth: "الحرية الحقيقية إنك تختار متى تتمرد، مو إنك تتمرد كل وقت.",
    cardLine: "يقرا القوانين... عشان يعرف كيف يكسرها",
  },
  {
    key: "bold",
    name: "المتهور الواثق",
    emoji: "🔥",
    primary: "recklessness",
    secondary: "control",
    description:
      "تاخذ قرارات بثانية وتمشي فيها بثقة تامة، صح كانت أو غلط. الشك مو من قاموسك، حتى لو طلعت النتيجة كارثة.",
    strengths: ["ثقتك تنقل للي حولك", "ما تضيع وقت بالتردد"],
    flaw: "الثقة بدون تفكير اسمها مخاطرة، مو شجاعة.",
    truth: "مرة بالعمر، فكر ثانية وحدة زيادة قبل لا تقرر.",
    cardLine: "يقفز أول، يسأل \"وش صار\" بعدين",
  },
  {
    key: "comfort_king",
    name: "راعي الراحة",
    emoji: "🛋️",
    primary: "comfort",
    secondary: "overthinking",
    description:
      "أي مجهود زيادة عن اللازم؟ لا شكرًا. تفضل الحل الأسهل دايمًا، حتى لو كان فيه حل أفضل يحتاج شوي تعب.",
    strengths: ["هادئ، ما يدخل بدراما محد يبيها", "يعرف يحافظ على طاقته"],
    flaw: "أحيانًا الراحة تتحول لعذر عشان ما تسوي اللي لازم تسويه.",
    truth: "الراحة حلوة، بس مو كل شي بالحياة يجي وأنت مستلقي.",
    cardLine: "طاقته محفوظة... من سنة ٢٠١٩",
  },
  {
    key: "whatever",
    name: "ما تفرق معي",
    emoji: "😎",
    primary: "comfort",
    secondary: "spontaneity",
    description:
      "كل شي عندك سهل. الخطة تتغير؟ عادي. أحد زعل؟ يعدي. الدنيا ما تستاهل توتر، وأنت آخر واحد يدخل بدراما محد يبيها.",
    strengths: ["ما تتوتر بسهولة", "الناس ترتاح وياك"],
    flaw: "أحيانًا اللامبالاة تصير تجاهل لأشياء تستاهل اهتمامك فعلًا.",
    truth: "\"ما تفرق معي\" أحيانًا بس طريقة تتجنب فيها المواجهة.",
    cardLine: "الإعدادات عنده كلها على وضع \"عادي\"",
  },
  {
    key: "drama_king",
    name: "ملك الدراما",
    emoji: "🎭",
    primary: "drama",
    secondary: "recklessness",
    description:
      "كل موقف عندك فيه فصل أول وثاني وثالث. لو صار شي بسيط، بيتحول عندك لحدث تاريخي يستاهل ستوري كاملة.",
    strengths: ["ما فيه ملل وياك أبدًا", "تعبر عن مشاعرك بدون ما تكبتها"],
    flaw: "أحيانًا تكبر الموضوع أكثر من حجمه الطبيعي بمراحل.",
    truth: "مو كل موقف يحتاج ٣ ستوريات وتغريدة. بعضها بس يعدي.",
    cardLine: "عنده مسلسل كامل... عن يومه العادي",
  },
  {
    key: "clown",
    name: "المهرج الرسمي",
    emoji: "🤡",
    primary: "spontaneity",
    secondary: "drama",
    description:
      "أي موقف، حتى لو محرج، تحوله لنكتة. الجدية مو أسلوبك، وردة فعلك الأولى دايمًا شي مضحك يخفف الموقف.",
    strengths: ["تخفف على الشلة بأي موقف", "ما تاخذ نفسك على محمل الجد كثير"],
    flaw: "أحيانًا تهرب من المواقف الجدية بالضحك بدل ما تواجهها.",
    truth: "مو كل شي لازم يكون نكتة. بعض المواقف تستاهل وقفة حقيقية.",
    cardLine: "جاهز بنكتة لأي موقف، حتى الجنازة",
  },
];
