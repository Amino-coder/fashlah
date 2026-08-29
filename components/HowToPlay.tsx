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

export type GameKey = "fashlah" | "shofah" | "job" | "qaseeda" | "qissa" | "lifoo" | "mareed" | "bidal" | "ihj" | "wadak" | "ruin_story" | "imposter" | "ibarat" | "trivia";

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
  qaseeda: {
    ar: {
      title: "كيف تلعبون كمل القصيدة؟",
      tagline: "بيت البداية، خمس جولات، وقصيدة كاملة 🪶",
      steps: [
        { icon: "📜", title: "اختاروا بيت البداية", body: "المضيف يختار من أربع أبيات مشهورة، أو يكتب بيت خاص بكم." },
        { icon: "📱", title: "جهاز لكل شخص", body: "المضيف ينشئ غرفة ويشارك الكود مع الشلة." },
        { icon: "✍️", title: "٥ جولات", body: "كل جولة، الكل يكتب البيت التالي بنفس الوقت." },
        { icon: "🗳️", title: "صوّتوا", body: "صوّتوا لأحلى بيت — ما تقدر تصوّت لبيتك. البيت الفايز يصير رسمي." },
        { icon: "🪶", title: "القصيدة", body: "بالنهاية تشوفون القصيدة كاملة، بيت بيت، ومين كتب كل واحد." },
        { icon: "🖼️", title: "شاركوها", body: "بطاقة أنيقة جاهزة للمشاركة — قصيدتكم الجماعية." },
      ],
      footer: "ما فيه قافية صح أو غلط — المهم الإحساس 🪶",
    },
    en: {
      title: "How to play Complete the Poem",
      tagline: "One opening line, five rounds, one finished poem 🪶",
      steps: [
        { icon: "📜", title: "Pick the opening line", body: "The host chooses from four famous أبيات, or writes a custom one." },
        { icon: "📱", title: "One phone each", body: "The host creates a room and shares the code with the group." },
        { icon: "✍️", title: "5 rounds", body: "Each round, everyone writes the next line at the same time." },
        { icon: "🗳️", title: "Vote", body: "Vote for the best line — you can't vote for your own. The winner becomes official." },
        { icon: "🪶", title: "The poem", body: "At the end you'll see the whole poem, line by line, and who wrote each one." },
        { icon: "🖼️", title: "Share it", body: "A beautifully designed card, ready to share — your group's collaborative poem." },
      ],
      footer: "There's no right or wrong rhyme — it's about the feeling 🪶",
    },
  },
  qissa: {
    ar: {
      title: "كيف تلعبون كمل القصة؟",
      tagline: "كل واحد يبدأ قصة... وتضيع بين الكل 😂",
      steps: [
        { icon: "📱", title: "جهاز لكل شخص", body: "المضيف ينشئ غرفة ويشارك الكود مع الشلة (لازم شخصين على الأقل)." },
        { icon: "✍️", title: "كل واحد يبدأ قصته", body: "بالجولة الأولى، كل شخص يكتب أول جملة من قصته الخاصة." },
        { icon: "🔄", title: "تنتقل القصة", body: "بعد كل جولة، كل قصة تنتقل للاعب التالي — بس هو يشوف آخر جملة بس، مو القصة كاملة!" },
        { icon: "🌀", title: "٦ جولات دايم", body: "كل قصة تتكون من ٦ جمل بالضبط — سواء كنتوا لاعبين اثنين أو خمسة عشر." },
        { icon: "📖", title: "القصص", body: "بالنهاية تشوفون كل قصة كاملة، جملة جملة، ومين كتب كل واحدة." },
      ],
      footer: "كل ما قلّ اللي تشوفه، زادت الطرافة 😂",
    },
    en: {
      title: "How to play Complete the Story",
      tagline: "Everyone starts a story... and it gets lost along the way 😂",
      steps: [
        { icon: "📱", title: "One phone each", body: "The host creates a room and shares the code (at least 2 players needed)." },
        { icon: "✍️", title: "Everyone starts their own story", body: "In round 1, everyone writes the first sentence of their own story." },
        { icon: "🔄", title: "Stories pass along", body: "After each round, every story moves to the next player — who only sees the last sentence, never the whole story!" },
        { icon: "🌀", title: "Always 6 rounds", body: "Every story ends up with exactly 6 sentences — whether it's 2 players or 15." },
        { icon: "📖", title: "The stories", body: "At the end you'll see every complete story, line by line, and who wrote each part." },
      ],
      footer: "The less you can see, the funnier it gets 😂",
    },
  },
  lifoo: {
    ar: {
      title: "كيف تلعبون الِّفوا أغنية؟",
      tagline: "بيت البداية، أربع جولات، وأغنية كاملة 🎶",
      steps: [
        { icon: "🎤", title: "اختاروا بداية الأغنية", body: "المضيف يختار من ثلاث بدايات مشهورة، أو يكتب بيت خاص بكم." },
        { icon: "📱", title: "جهاز لكل شخص", body: "المضيف ينشئ غرفة ويشارك الكود مع الشلة." },
        { icon: "✍️", title: "٤ جولات", body: "كل جولة، الكل يكتب سطر واحد جديد بنفس الوقت." },
        { icon: "🗳️", title: "صوّتوا", body: "صوّتوا لأحلى سطر — السطر الفايز يصير رسمي وينضم للأغنية." },
        { icon: "🎶", title: "الأغنية", body: "بالنهاية تشوفون الأغنية كاملة، سطر سطر، ومين كتب كل واحد." },
        { icon: "🖼️", title: "شاركوها", body: "بطاقة جاهزة للمشاركة — أغنيتكم الجماعية المجنونة." },
      ],
      footer: "كل ما زاد الجنون، زادت الأغنية حلاوة 😂",
    },
    en: {
      title: "How to play Build a Song",
      tagline: "One starting verse, four rounds, one finished song 🎶",
      steps: [
        { icon: "🎤", title: "Pick the starting verse", body: "The host chooses from three famous verses, or writes a custom one." },
        { icon: "📱", title: "One phone each", body: "The host creates a room and shares the code with the group." },
        { icon: "✍️", title: "4 rounds", body: "Each round, everyone writes one new line at the same time." },
        { icon: "🗳️", title: "Vote", body: "Vote for the best line — the winner becomes official and joins the song." },
        { icon: "🎶", title: "The song", body: "At the end you'll see the whole song, line by line, and who wrote each one." },
        { icon: "🖼️", title: "Share it", body: "A shareable card, ready to go — your group's ridiculous song." },
      ],
      footer: "The sillier it gets, the better the song 😂",
    },
  },
  mareed: {
    ar: {
      title: "كيف تلعبون مريض نفسي؟",
      tagline: "جولة تسخين، ٥ أسئلة، وبعدها التشخيص 🧠",
      steps: [
        { icon: "📱", title: "جهاز لكل شخص", body: "المضيف ينشئ غرفة ويشارك الكود مع الشلة." },
        { icon: "🔥", title: "جولة التسخين", body: "٥ أسئلة سريعة، صوّتوا على بعض. للضحك بس — ما تحسب في النتيجة." },
        { icon: "✍️", title: "٥ جولات", body: "يجيكم سؤال غريب، وكل واحد يكتب رده بأغرب طريقة." },
        { icon: "🗳️", title: "صوّتوا", body: "بعدها صوّتوا على أغرب رد — وبتشوفون مين كتب وش." },
        { icon: "🧠", title: "التشخيص", body: "بالنهاية تشوفون المحادثة كاملة، ومين المريض النفسي رسمياً." },
      ],
      footer: "الردود الأغرب عادة هي اللي تفوز 👀",
    },
    en: {
      title: "How to play Psych Patient",
      tagline: "A warm-up, 5 questions, then the diagnosis 🧠",
      steps: [
        { icon: "📱", title: "One phone each", body: "The host creates a room and shares the code with the group." },
        { icon: "🔥", title: "Warm-up round", body: "5 quick questions voting on each other. Just for laughs — it doesn't affect scoring." },
        { icon: "✍️", title: "5 rounds", body: "You'll get a weird prompt, and everyone writes the strangest answer they can." },
        { icon: "🗳️", title: "Vote", body: "Then vote on the strangest answer — and see who wrote what." },
        { icon: "🧠", title: "The diagnosis", body: "At the end you'll see the whole conversation, and who's officially the psych patient." },
      ],
      footer: "The weirdest answers usually win 👀",
    },
  },
  bidal: {
    ar: {
      title: "كيف تلعب بدل الكلمة؟",
      tagline: "بدّل حرف، كوّن كلمة جديدة، وخلّص حروفك 🔤",
      steps: [
        { icon: "🔤", title: "كلمة البداية", body: "تبدأ بكلمة من ٣ حروف، وعندك ١٥ حرف تحت إيدك." },
        { icon: "👆", title: "بدّل حرف", body: "اختر حرف من حروفك وحطه مكان أي حرف في الكلمة الحالية." },
        { icon: "✅", title: "كلمة صح بس", body: "لازم تكوّن كلمة عربية حقيقية، وإلا ما بتنقبل." },
        { icon: "🔁", title: "كمّل", body: "كل بدلة تستخدم حرف من حروفك وتكوّن كلمة جديدة — كمّل بأكبر عدد ممكن." },
        { icon: "🏆", title: "الهدف", body: "خلّص كل حروفك الـ١٥ قبل ما ينتهي وقتك." },
      ],
      footer: "فكر بالحرف قبل لا تحطه — بعض البدلات توقفك بسرعة 😅",
    },
    en: {
      title: "How to play Word Swap",
      tagline: "Swap a letter, form a new word, empty your hand 🔤",
      steps: [
        { icon: "🔤", title: "Starting word", body: "You begin with a 3-letter word, and 15 letters in your hand." },
        { icon: "👆", title: "Swap a letter", body: "Pick a letter from your hand and place it over any letter in the current word." },
        { icon: "✅", title: "Real words only", body: "It has to form an actual Arabic word, or the swap won't go through." },
        { icon: "🔁", title: "Keep going", body: "Every swap uses one of your letters and makes a new word — chain as many as you can." },
        { icon: "🏆", title: "The goal", body: "Empty all 15 letters from your hand before time runs out." },
      ],
      footer: "Think before you swap — some moves box you in fast 😅",
    },
  },
  ihj: {
    ar: {
      title: "كيف تلعبون إنسان حيوان جماد؟",
      tagline: "حرف واحد، خمس فئات، ومين أسرع بالكتابة 🧠",
      steps: [
        { icon: "🎲", title: "حرف عشوائي", body: "كل جولة يطلع لكم حرف تبدأ فيه إجاباتكم." },
        { icon: "📋", title: "٥ فئات", body: "إنسان، حيوان، جماد، نبات، بلاد — جاوبوا على كل وحدة بكلمة تبدأ بنفس الحرف." },
        { icon: "⏱️", title: "الوقت يجري", body: "كل اللاعبين يجاوبون بنفس الوقت، وين ما وصلتوا يُحسب." },
        { icon: "🏆", title: "التسجيل", body: "إجابة ما حد كتبها غيرك = ١٠ نقاط. إجابة مشتركة مع غيرك = ٥ نقاط لكل واحد." },
      ],
      footer: "الإجابات النادرة هي اللي تفرق 👀",
    },
    en: {
      title: "How to play Categories",
      tagline: "One letter, five categories, whoever's fastest 🧠",
      steps: [
        { icon: "🎲", title: "A random letter", body: "Each round gives you a letter your answers need to start with." },
        { icon: "📋", title: "5 categories", body: "Person, animal, object, plant, country — answer each with a word starting with that letter." },
        { icon: "⏱️", title: "Time's ticking", body: "Everyone answers at the same time — whatever you've filled in when it ends counts." },
        { icon: "🏆", title: "Scoring", body: "An answer nobody else wrote = 10 points. An answer shared with someone else = 5 points each." },
      ],
      footer: "The rare answers are what set you apart 👀",
    },
  },
  wadak: {
    ar: {
      title: "كيف تلعب وش شخصيتك؟",
      tagline: "جاوب على الأسئلة، واكتشف شخصيتك الحقيقية 🧠",
      steps: [
        { icon: "❓", title: "أسئلة سريعة", body: "بتجاوب على مجموعة أسئلة عن تصرفاتك وردود أفعالك." },
        { icon: "🎯", title: "كل إجابة تحسب", body: "كل خيار تختاره يقربك من شخصية معينة." },
        { icon: "📊", title: "النتيجة", body: "بالنهاية تشوف شخصيتك على شكل مخطط، مع وصف يناسبك." },
        { icon: "📤", title: "شارك", body: "شارك نتيجتك مع أصحابك وشوفوا مين يشبه شخصيته." },
      ],
      footer: "جاوب بصراحة — النتيجة أدق كذا 👀",
    },
    en: {
      title: "How to play What's Your Personality",
      tagline: "Answer honestly, discover your real personality type 🧠",
      steps: [
        { icon: "❓", title: "Quick questions", body: "You'll answer a set of questions about your habits and reactions." },
        { icon: "🎯", title: "Every answer counts", body: "Each choice you make nudges you toward a specific personality type." },
        { icon: "📊", title: "Your result", body: "At the end you'll see your personality mapped out, with a description that fits." },
        { icon: "📤", title: "Share it", body: "Share your result with friends and see whose type matches yours." },
      ],
      footer: "Answer honestly — the result is more accurate that way 👀",
    },
  },
  ruin_story: {
    ar: {
      title: "كيف تلعبون خرب السالفة؟",
      tagline: "٦ جولات، بطاقة سوداء، وأغرب جواب يفوز 🃏",
      steps: [
        { icon: "🃏", title: "٦ كروت إجابة", body: "عندك دايم ٦ كروت بيضاء، وكل جولة تختار وحدة منها." },
        { icon: "⚫", title: "البطاقة السوداء", body: "كل جولة فيها موقف أو سؤال ناقصه كلمة — جاوب بأغرب كرت عندك." },
        { icon: "👑", title: "دور الحكم", body: "لاعب واحد كل جولة يكون الحكم، وما يشارك بإجابة." },
        { icon: "🕵️", title: "إجابات مجهولة", body: "الحكم يشوف كل الإجابات بدون أسماء، ويختار الأضحك." },
        { icon: "🏆", title: "نقطة للفائز", body: "صاحب أغرب إجابة ياخذ نقطة، والحكم يتغير كل جولة." },
      ],
      footer: "٦ جولات بس — بعدها تشوفون الفايز الكلي 🎉",
    },
    en: {
      title: "How to play Ruin the Story",
      tagline: "6 rounds, a black card, and the weirdest answer wins 🃏",
      steps: [
        { icon: "🃏", title: "6 answer cards", body: "You always have 6 white cards in hand — pick one each round." },
        { icon: "⚫", title: "The black card", body: "Every round shows a situation or question with a blank — answer it with your funniest card." },
        { icon: "👑", title: "The judge", body: "One player each round is the judge, and doesn't submit an answer." },
        { icon: "🕵️", title: "Anonymous answers", body: "The judge sees every submission with no names attached, and picks the funniest." },
        { icon: "🏆", title: "A point for the winner", body: "Whoever's card wins gets a point, and the judge rotates every round." },
      ],
      footer: "Just 6 rounds — then you'll see the overall winner 🎉",
    },
  },
  imposter: {
    ar: {
      title: "كيف تلعبون المحتال؟",
      tagline: "وحد فيكم محتال... من بيكتشفه؟ 😈",
      steps: [
        { icon: "📱", title: "جهاز لكل شخص", body: "المضيف ينشئ غرفة ويشارك الكود مع الشلة." },
        { icon: "😈", title: "وحد فيكم المحتال", body: "يعرف الكل الكلمة إلا المحتال — هو ما بيعرفها أبد." },
        { icon: "💬", title: "كل واحد يعطي تلميحين", body: "بدوركم، كل لاعب يعطي تلميح عن الكلمة، بدون ما يكشفها — ودورة ثانية بعدها." },
        { icon: "🕵️", title: "المحتال يمثّل", body: "المحتال يحاول يعطي تلميح يقنع فيه الباقين، مع إنه ما يعرف الكلمة." },
        { icon: "🗳️", title: "صوّتوا", body: "بعد ما يخلص الكل، تصوتون مين تتوقعون المحتال." },
        { icon: "🎉", title: "الكشف", body: "تشوفون مين كان المحتال والكلمة — سواء لقيتوه أو لا." },
      ],
      footer: "التلميحات الغامضة أول شي يكشف المحتال 👀",
    },
    en: {
      title: "How to play Imposter",
      tagline: "One of you is an imposter... who'll catch them? 😈",
      steps: [
        { icon: "📱", title: "One phone each", body: "The host creates a room and shares the code with the group." },
        { icon: "😈", title: "One of you is the Imposter", body: "Everyone knows the word except the Imposter — they never see it at all." },
        { icon: "💬", title: "Everyone gives two clues", body: "Taking turns, each player gives a clue about the word without giving it away — then a second round of clues follows." },
        { icon: "🕵️", title: "The Imposter fakes it", body: "The Imposter tries to give a convincing clue despite not knowing the word." },
        { icon: "🗳️", title: "Vote", body: "Once everyone's gone, vote on who you think the Imposter is." },
        { icon: "🎉", title: "The reveal", body: "See who the Imposter really was and what the word was — whether you caught them or not." },
      ],
      footer: "Vague clues are usually the first giveaway 👀",
    },
  },
  ibarat: {
    ar: {
      title: "كيف تلعب عبارات؟",
      tagline: "بطاقة إلهام يومية",
      steps: [
        { icon: "🎴", title: "بطاقة كل يوم", body: "افتح اللعبة وشوف عبارة أو اقتباس جديد كل يوم." },
        { icon: "🔄", title: "اسحب كم بطاقة تبي", body: "تقدر تسحب أكثر من بطاقة، وكل مرة تجيك عبارة مختلفة عن اللي قبلها." },
        { icon: "📤", title: "شارك", body: "أعجبتك العبارة؟ شاركها مع أصحابك مباشرة." },
      ],
      footer: "عبارة جديدة كل يوم 🌿",
    },
    en: {
      title: "How to play Phrases",
      tagline: "A daily card of inspiration",
      steps: [
        { icon: "🎴", title: "A new card daily", body: "Open the game to see a new phrase or quote each day." },
        { icon: "🔄", title: "Draw as many as you like", body: "Pull more than one card — each draw gives you a different phrase than the last." },
        { icon: "📤", title: "Share it", body: "Liked it? Share it straight with your friends." },
      ],
      footer: "A new phrase every day 🌿",
    },
  },
  trivia: {
    ar: {
      title: "كيف تلعب سؤال وجواب؟",
      tagline: "أسئلة سريعة، وأسرعكم بالإجابة يفوز \u26A1",
      steps: [
        { icon: "\u2753", title: "اختر إجابة", body: "اختر الإجابة الصحيحة من بين 4 خيارات." },
        { icon: "\u2705", title: "إجابة وحدة صح", body: "كل سؤال له إجابة صحيحة واحدة بس." },
        { icon: "\u23F1\uFE0F", title: "بسرعة!", body: "حاول تجاوب قبل انتهاء الوقت — كل ما جاوبت أسرع، نقاط أكثر." },
        { icon: "\u{1F4A1}", title: "اعرف السبب", body: "بعد كل سؤال بتشوف الإجابة الصحيحة مع تفسير قصير." },
      ],
      footer: "اختر فئاتك المفضلة وشوف وش تعرف \u{1F9E0}",
    },
    en: {
      title: "How to play Q&A Trivia",
      tagline: "Fast questions, fastest answer wins \u26A1",
      steps: [
        { icon: "\u2753", title: "Pick an answer", body: "Choose the correct answer out of 4 choices." },
        { icon: "\u2705", title: "Only one is right", body: "Every question has exactly one correct answer." },
        { icon: "\u23F1\uFE0F", title: "Be quick!", body: "Try to answer before time runs out — the faster you answer, the more points you earn." },
        { icon: "\u{1F4A1}", title: "Learn why", body: "After each question you'll see the correct answer with a short explanation." },
      ],
      footer: "Pick your favorite categories and see what you know \u{1F9E0}",
    },
  },
};

const ACCENTS: Record<GameKey, { from: string; to: string }> = {
  fashlah: { from: "#FF2E93", to: "#7C3AED" },
  shofah: { from: "#E63946", to: "#C2185B" },
  job: { from: "#3B82F6", to: "#1E40AF" },
  qaseeda: { from: "#D9A441", to: "#1B3A55" },
  qissa: { from: "#FF8A3D", to: "#E0409A" },
  lifoo: { from: "#FF5A5F", to: "#1B1030" },
  mareed: { from: "#FF2E93", to: "#7C3AED" },
  bidal: { from: "#14B8A6", to: "#FF5A5F" },
  ihj: { from: "#7C3AED", to: "#FF2E93" },
  wadak: { from: "#7C3AED", to: "#FF2E93" },
  ruin_story: { from: "#9B1C2E", to: "#C9302C" },
  imposter: { from: "#D6006E", to: "#FF2E93" },
  ibarat: { from: "#22C55E", to: "#14B8A6" },
  trivia: { from: "#3B82F6", to: "#1E40AF" },
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
