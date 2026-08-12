/**
 * شوفة solo mode's warm-up questions — forked from وش شخصيتك's
 * ROUND1_POOL (lib/wadak-content.ts) rather than imported from it.
 * They started identical, but now carry شوفة-specific edits (new/changed
 * options), so keeping them as separate content avoids silently changing
 * وش شخصيتك's actual game whenever this file is edited for شوفة.
 */

export type WarmupOption = { id: string; emoji: string; text: string };
export type WarmupQuestion = { id: string; prompt: string; options: WarmupOption[] };

export const SHOFAH_WARMUP_QUESTIONS: WarmupQuestion[] = [
  {
    id: "r1_mood", prompt: "مودي غالبًا…",
    options: [
      { id: "a", emoji: "😂", text: "أضحك" },
      { id: "b", emoji: "🤔", text: "أفكر زيادة" },
      { id: "c", emoji: "😌", text: "مرتاح" },
      { id: "d", emoji: "🎭", text: "درامي" },
    ],
  },
  {
    id: "r1_mornings", prompt: "صباحاتي…",
    options: [
      { id: "a", emoji: "⏰", text: "أصحى بدري" },
      { id: "b", emoji: "😴", text: "أأجل المنبه للأبد" },
      { id: "c", emoji: "🎶", text: "المنبه يقلب DJ بالحلم" },
      { id: "d", emoji: "🤷", text: "ما أتذكر إني صحيت" },
    ],
  },
  {
    id: "r1_groupchats", prompt: "بقروبات الواتساب أنا…",
    options: [
      { id: "a", emoji: "⚡", text: "أرد فوراً" },
      { id: "b", emoji: "👀", text: "أقرا واسكت" },
      { id: "c", emoji: "🎙️", text: "أرسل ١٠ فويس" },
      { id: "d", emoji: "🔕", text: "أصمت كل شي" },
    ],
  },
  {
    id: "r1_exams", prompt: "الاختبارات أنا…",
    options: [
      { id: "a", emoji: "📚", text: "أذاكر من أسابيع" },
      { id: "b", emoji: "🌙", text: "أذاكر آخر ليلة" },
      { id: "c", emoji: "🎲", text: "أرتجل" },
      { id: "d", emoji: "🔍", text: "أبرشم كل شي" },
    ],
  },
  {
    id: "r1_room", prompt: "غرفتي…",
    options: [
      { id: "a", emoji: "✨", text: "نظيفة ومرتبة" },
      { id: "b", emoji: "📦", text: "فوضى منظمة" },
      { id: "c", emoji: "🌪️", text: "منطقة كوارث" },
      { id: "d", emoji: "🖼️", text: "شكلها حلو بس فيها خبايا" },
    ],
  },
  {
    id: "r1_weekend", prompt: "خطط الويكند…",
    options: [
      { id: "a", emoji: "🗓️", text: "جدول مليان" },
      { id: "b", emoji: "🎲", text: "قرار اللحظة الأخيرة" },
      { id: "c", emoji: "🛏️", text: "أقعد بالسرير" },
      { id: "d", emoji: "🤝", text: "أي شي يقرره القروب" },
    ],
  },
];

/**
 * Exactly 2 of 4 options per question count as "lucky" (50% of options
 * per question), and the couples aren't specified by the request — these
 * are my picks, loosely themed around "put-together or endearing," easy
 * to swap since they're isolated here as one array per question.
 */
export const LUCKY_OPTIONS_BY_QUESTION: Record<string, string[]> = {
  r1_mood: ["c", "a"],           // مرتاح + أضحك
  r1_mornings: ["a", "c"],        // أصحى بدري + المنبه يقلب DJ
  r1_groupchats: ["a", "b"],      // أرد فوراً + أقرا واسكت
  r1_exams: ["a", "b"],           // أذاكر من أسابيع + أذاكر آخر ليلة
  r1_room: ["a", "b"],            // نظيفة ومرتبة + فوضى منظمة
  r1_weekend: ["a", "d"],         // جدول مليان + أي شي يقرره القروب
};

export const MAX_LUCKY = SHOFAH_WARMUP_QUESTIONS.length; // 6

/** With 2-of-4 lucky per question, a genuinely random pick lands lucky
 *  ~50% of the time per question — the fair "coin flip" threshold across
 *  6 questions is "at least half," i.e. >= 3. */
export const MARRIED_THRESHOLD = 3;
