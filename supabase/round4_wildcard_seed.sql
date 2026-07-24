-- Run AFTER migration_008_round4_wildcard.sql.
-- Adds 24 Round 4 questions (14 Would You Rather + 10 fill-in-the-blank).
-- Each session shows a random 8, mixed type (Round4.tsx's
-- seededShuffle().slice(0,8)).

insert into questions (pack_id, round, question_type, category, difficulty, text_ar, text_en, weight, options) values

-- WOULD YOU RATHER (this_or_that)
('11111111-1111-1111-1111-111111111111', 4, 'this_or_that', 'wyr_powers', 'funny',
 'وش تختار؟', 'Which would you rather?', 1,
 '[{"id":"a","emoji":"✈️","text_ar":"تطير","text_en":"Be able to fly"},
   {"id":"b","emoji":"👻","text_ar":"تختفي عن العيون","text_en":"Be invisible"}]'),

('11111111-1111-1111-1111-111111111111', 4, 'this_or_that', 'wyr_offline', 'mixed',
 'وش تختار؟', 'Which would you rather?', 1,
 '[{"id":"a","emoji":"📵","text_ar":"بدون سوشال ميديا للأبد","text_en":"Never use social media again"},
   {"id":"b","emoji":"🎬","text_ar":"بدون أفلام ومسلسلات للأبد","text_en":"Never watch movies/shows again"}]'),

('11111111-1111-1111-1111-111111111111', 4, 'this_or_that', 'wyr_timing', 'funny',
 'وش تختار؟', 'Which would you rather?', 1,
 '[{"id":"a","emoji":"⏰","text_ar":"دايم متأخر ١٠ دقايق","text_en":"Always be 10 min late"},
   {"id":"b","emoji":"⏳","text_ar":"دايم مبكر ٣٠ دقيقة","text_en":"Always be 30 min early"}]'),

('11111111-1111-1111-1111-111111111111', 4, 'this_or_that', 'wyr_money_friends', 'deep',
 'وش تختار؟', 'Which would you rather?', 1,
 '[{"id":"a","emoji":"💰","text_ar":"فلوس بلا حدود بدون أصحاب","text_en":"Unlimited money but no friends"},
   {"id":"b","emoji":"👯","text_ar":"أصحاب بلا حدود بدون فلوس","text_en":"Unlimited friends but no money"}]'),

('11111111-1111-1111-1111-111111111111', 4, 'this_or_that', 'wyr_fame', 'chaotic',
 'وش تختار؟', 'Which would you rather?', 1,
 '[{"id":"a","emoji":"😳","text_ar":"تشتهر بشي محرج","text_en":"Be famous for something embarrassing"},
   {"id":"b","emoji":"🙈","text_ar":"ما تشتهر أبد","text_en":"Never be famous at all"}]'),

('11111111-1111-1111-1111-111111111111', 4, 'this_or_that', 'wyr_lose', 'funny',
 'وش تختار؟', 'Which would you rather?', 1,
 '[{"id":"a","emoji":"📸","text_ar":"تفقد كل صورك","text_en":"Lose all your photos"},
   {"id":"b","emoji":"📵","text_ar":"تفقد كل أرقامك","text_en":"Lose all your contacts"}]'),

('11111111-1111-1111-1111-111111111111', 4, 'this_or_that', 'wyr_honesty', 'deep',
 'وش تختار؟', 'Which would you rather?', 1,
 '[{"id":"a","emoji":"🗣️","text_ar":"تقول اللي بخاطرك دايم","text_en":"Always say what you think out loud"},
   {"id":"b","emoji":"🤐","text_ar":"ما تقدر تعبر عن رأيك أبد","text_en":"Never speak your mind again"}]'),

('11111111-1111-1111-1111-111111111111', 4, 'this_or_that', 'wyr_fight', 'chaotic',
 'وش تختار؟', 'Which would you rather?', 1,
 '[{"id":"a","emoji":"🦆","text_ar":"تحارب بطة بحجم حصان","text_en":"Fight one horse-sized duck"},
   {"id":"b","emoji":"🐴","text_ar":"تحارب ١٠٠ حصان بحجم بطة","text_en":"Fight 100 duck-sized horses"}]'),

('11111111-1111-1111-1111-111111111111', 4, 'this_or_that', 'wyr_talk', 'funny',
 'وش تختار؟', 'Which would you rather?', 1,
 '[{"id":"a","emoji":"🎤","text_ar":"تغني كل كلمة تقولها ليوم كامل","text_en":"Sing everything you say for a day"},
   {"id":"b","emoji":"🤫","text_ar":"تهمس كل كلمة ليوم كامل","text_en":"Whisper everything you say for a day"}]'),

('11111111-1111-1111-1111-111111111111', 4, 'this_or_that', 'wyr_time_travel', 'mixed',
 'وش تختار؟', 'Which would you rather?', 1,
 '[{"id":"a","emoji":"⏪","text_ar":"تسافر للماضي","text_en":"Time travel to the past"},
   {"id":"b","emoji":"⏩","text_ar":"تسافر للمستقبل","text_en":"Time travel to the future"}]'),

('11111111-1111-1111-1111-111111111111', 4, 'this_or_that', 'wyr_food', 'funny',
 'وش تختار؟', 'Which would you rather?', 1,
 '[{"id":"a","emoji":"🚫","text_ar":"ما تاكل أكلتك المفضلة أبد","text_en":"Never eat your favorite food again"},
   {"id":"b","emoji":"🍕","text_ar":"تاكل بس أكلتك المفضلة للأبد","text_en":"Only eat your favorite food forever"}]'),

('11111111-1111-1111-1111-111111111111', 4, 'this_or_that', 'wyr_power2', 'mixed',
 'وش تختار؟', 'Which would you rather?', 1,
 '[{"id":"a","emoji":"🧠","text_ar":"تقرا أفكار الناس","text_en":"Read people''s minds"},
   {"id":"b","emoji":"👻","text_ar":"تختفي متى ما تبي","text_en":"Be invisible whenever you want"}]'),

('11111111-1111-1111-1111-111111111111', 4, 'this_or_that', 'wyr_lifestyle', 'mixed',
 'وش تختار؟', 'Which would you rather?', 1,
 '[{"id":"a","emoji":"🎵","text_ar":"تعيش بدون موسيقى","text_en":"Live without music"},
   {"id":"b","emoji":"📱","text_ar":"تعيش بدون جوالك","text_en":"Live without your phone"}]'),

('11111111-1111-1111-1111-111111111111', 4, 'this_or_that', 'wyr_truth_lie', 'deep',
 'وش تختار؟', 'Which would you rather?', 1,
 '[{"id":"a","emoji":"💯","text_ar":"دايم تقول الصدق","text_en":"Always have to tell the truth"},
   {"id":"b","emoji":"🤥","text_ar":"دايم تكذب","text_en":"Always have to lie"}]'),

-- FILL IN THE BLANK (open_text) — revealed at Results with name/avatar
('11111111-1111-1111-1111-111111111111', 4, 'open_text', 'prison', 'chaotic',
 'لو يوماً أدخل السجن، بيكون بسبب ___', 'If I ever go to prison, it''ll be because ___', 1, '[{"id":"a","emoji":"🚔"}]'),

('11111111-1111-1111-1111-111111111111', 4, 'open_text', 'last_lie', 'chaotic',
 'آخر كذبة قلتها لأصحابي كانت عن ___', 'The last lie I told my friends was about ___', 1, '[{"id":"a","emoji":"🤥"}]'),

('11111111-1111-1111-1111-111111111111', 4, 'open_text', 'useless_talent', 'funny',
 'أغرب موهبة عندي وما تفيد بشي هي ___', 'My most useless talent is ___', 1, '[{"id":"a","emoji":"🎪"}]'),

('11111111-1111-1111-1111-111111111111', 4, 'open_text', 'warning_label', 'funny',
 'لو حياتي عليها ملصق تحذير، بيكتب فيه ___', 'If my life had a warning label, it would say ___', 1, '[{"id":"a","emoji":"⚠️"}]'),

('11111111-1111-1111-1111-111111111111', 4, 'open_text', 'search_history', 'chaotic',
 'أغرب شي في سجل بحثي بقوقل غالباً ___', 'The weirdest thing in my search history is probably ___', 1, '[{"id":"a","emoji":"🔍"}]'),

('11111111-1111-1111-1111-111111111111', 4, 'open_text', 'villain_origin', 'chaotic',
 'قصة أصلي كـ"شرير" بتبدأ بـ ___', 'My villain origin story would start with ___', 1, '[{"id":"a","emoji":"🦹"}]'),

('11111111-1111-1111-1111-111111111111', 4, 'open_text', 'late_excuse', 'funny',
 'السبب الحقيقي إني تأخرت اليوم هو ___', 'The real reason I was late today is ___', 1, '[{"id":"a","emoji":"⏰"}]'),

('11111111-1111-1111-1111-111111111111', 4, 'open_text', 'autobiography', 'funny',
 'لو أكتب سيرتي الذاتية، عنوانها بيكون ___', 'My autobiography title would be ___', 1, '[{"id":"a","emoji":"📖"}]'),

('11111111-1111-1111-1111-111111111111', 4, 'open_text', 'weird_excuse', 'chaotic',
 'أغرب عذر استخدمته بحياتي هو ___', 'The weirdest excuse I''ve ever used is ___', 1, '[{"id":"a","emoji":"🎭"}]'),

('11111111-1111-1111-1111-111111111111', 4, 'open_text', 'aliens', 'chaotic',
 'لو نزلت المخلوقات الفضائية باكر، أول شي بسويه هو ___', 'If aliens landed tomorrow, my first move would be to ___', 1, '[{"id":"a","emoji":"👽"}]');
