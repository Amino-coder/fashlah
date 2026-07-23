-- ============================================================================
-- BAGDOONIS — seed data for the "Friends" pack (v2)
-- Run after schema.sql on a fresh project. Everything here is data — the app
-- never needs a redeploy to add a question, award, or template.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PACK
-- ----------------------------------------------------------------------------
insert into question_packs (id, slug, icon, name_ar, name_en, description_ar, description_en, sort_order)
values ('11111111-1111-1111-1111-111111111111', 'friends', '👯', 'الأصدقاء', 'Friends',
        'الباقة الأساسية لأي شلة', 'The default pack for any friend group', 1);

-- ----------------------------------------------------------------------------
-- ROUND 1 — SELF (emoji multiple choice). 35 questions in the bank; each
-- session randomly shows 10 (see Round1.tsx's seededShuffle().slice(0,10)).
-- ----------------------------------------------------------------------------
insert into questions (pack_id, round, question_type, category, difficulty, text_ar, text_en, weight, options) values
('11111111-1111-1111-1111-111111111111', 1, 'self', 'mood', 'funny',
 'مودي غالبًا…', 'My mood is usually…', 1,
 '[{"id":"a","emoji":"😂","text_ar":"أضحك","text_en":"Laughing","trait_weights":{"humor":0.7}},
   {"id":"b","emoji":"🤔","text_ar":"أفكر زيادة","text_en":"Overthinking","trait_weights":{"responsibility":0.4}},
   {"id":"c","emoji":"😌","text_ar":"مرتاح","text_en":"Chill","trait_weights":{"kindness":0.4}},
   {"id":"d","emoji":"🎭","text_ar":"درامي","text_en":"Dramatic","trait_weights":{"humor":0.5}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'mornings', 'funny',
 'صباحاتي…', 'My mornings…', 1,
 '[{"id":"a","emoji":"⏰","text_ar":"أصحى بدري","text_en":"Up early","trait_weights":{"organization":0.7,"responsibility":0.5}},
   {"id":"b","emoji":"😴","text_ar":"أأجل المنبه للأبد","text_en":"Hit snooze forever","trait_weights":{"energy":-0.4}},
   {"id":"c","emoji":"🌪️","text_ar":"من أول ثانية أزمة","text_en":"Already mid-crisis","trait_weights":{"humor":0.5}},
   {"id":"d","emoji":"🤷","text_ar":"ما أتذكر إني صحيت","text_en":"Don''t remember waking up","trait_weights":{"humor":0.6}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'group_chats', 'funny',
 'بقروبات الواتساب أنا…', 'In group chats I…', 1,
 '[{"id":"a","emoji":"⚡","text_ar":"أرد فوراً","text_en":"Reply instantly","trait_weights":{"energy":0.6}},
   {"id":"b","emoji":"👀","text_ar":"أقرا واسكت","text_en":"Leave on read","trait_weights":{}},
   {"id":"c","emoji":"🎙️","text_ar":"أرسل ١٠ فويس","text_en":"Send 10 voice notes","trait_weights":{"humor":0.5}},
   {"id":"d","emoji":"🔕","text_ar":"أكتم كل شي","text_en":"Mute everything","trait_weights":{}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'exams', 'mixed',
 'الاختبارات أنا…', 'For exams I…', 1,
 '[{"id":"a","emoji":"📚","text_ar":"أذاكر من أسابيع","text_en":"Study weeks ahead","trait_weights":{"organization":0.8,"responsibility":0.7}},
   {"id":"b","emoji":"🌙","text_ar":"أذاكر آخر ليلة","text_en":"Cram the night before","trait_weights":{"energy":0.4}},
   {"id":"c","emoji":"🎲","text_ar":"أرتجل","text_en":"Wing it","trait_weights":{"adventure":0.6,"organization":-0.5}},
   {"id":"d","emoji":"🔍","text_ar":"أقلّب قوقل ذعران","text_en":"Panic-Google everything","trait_weights":{"humor":0.4}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'room', 'mixed',
 'غرفتي…', 'My room is…', 1,
 '[{"id":"a","emoji":"✨","text_ar":"نظيفة ومرتبة","text_en":"Spotless","trait_weights":{"organization":0.8}},
   {"id":"b","emoji":"📦","text_ar":"فوضى منظمة","text_en":"Organized chaos","trait_weights":{"organization":0.3}},
   {"id":"c","emoji":"🌪️","text_ar":"منطقة كوارث","text_en":"Disaster zone","trait_weights":{"organization":-0.7}},
   {"id":"d","emoji":"🖼️","text_ar":"شكلها حلو بس فيها خبايا","text_en":"Looks nice but hides secrets","trait_weights":{"humor":0.5}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'weekend', 'mixed',
 'خطط الويكند…', 'Weekend plans…', 1,
 '[{"id":"a","emoji":"🗓️","text_ar":"جدول مليان","text_en":"Packed schedule","trait_weights":{"organization":0.6,"energy":0.5}},
   {"id":"b","emoji":"🎲","text_ar":"قرار اللحظة الأخيرة","text_en":"Last-minute decision","trait_weights":{"adventure":0.5}},
   {"id":"c","emoji":"🛏️","text_ar":"أضل بالسرير كله","text_en":"Stay in bed all day","trait_weights":{"energy":-0.5}},
   {"id":"d","emoji":"🤝","text_ar":"أي شي يقرره القروب","text_en":"Whatever the group wants","trait_weights":{"kindness":0.6}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'hunger', 'funny',
 'إذا جعت…', 'When I''m hungry…', 1,
 '[{"id":"a","emoji":"🍕","text_ar":"آكل أي شي","text_en":"Eat anything","trait_weights":{}},
   {"id":"b","emoji":"🎯","text_ar":"لازم أكل معين","text_en":"Very specific cravings","trait_weights":{}},
   {"id":"c","emoji":"⏳","text_ar":"أنسى آكل","text_en":"Forget to eat","trait_weights":{"responsibility":-0.3}},
   {"id":"d","emoji":"🍿","text_ar":"أتسلّى طول اليوم","text_en":"Snack all day","trait_weights":{}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'phone_battery', 'funny',
 'بطارية جوالي…', 'My phone battery…', 1,
 '[{"id":"a","emoji":"🔋","text_ar":"١٠٠٪ دايم","text_en":"Always full","trait_weights":{"organization":0.5}},
   {"id":"b","emoji":"🪫","text_ar":"تموت بسرعة","text_en":"Always dying","trait_weights":{}},
   {"id":"c","emoji":"📱","text_ar":"مكسور وفخور فيه","text_en":"Cracked screen and proud","trait_weights":{"confidence":0.5}},
   {"id":"d","emoji":"🔔","text_ar":"١٠٠ إشعار ماقريتها","text_en":"100 unread notifications","trait_weights":{}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'group_projects', 'mixed',
 'بمشاريع القروب…', 'In group projects…', 1,
 '[{"id":"a","emoji":"💪","text_ar":"أسوي كل شي لحالي","text_en":"Do everything myself","trait_weights":{"leadership":0.7,"responsibility":0.6}},
   {"id":"b","emoji":"👻","text_ar":"أختفي كليًا","text_en":"Disappear entirely","trait_weights":{"responsibility":-0.6}},
   {"id":"c","emoji":"📣","text_ar":"أوزع المهام على الكل","text_en":"Boss everyone around","trait_weights":{"leadership":0.6}},
   {"id":"d","emoji":"🎨","text_ar":"بس أسوي السلايدات","text_en":"Only do the slides","trait_weights":{}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'texting_style', 'funny',
 'طريقة كتابتي…', 'My texting style…', 1,
 '[{"id":"a","emoji":"✍️","text_ar":"قواعد مضبوطة","text_en":"Perfect grammar","trait_weights":{"organization":0.5}},
   {"id":"b","emoji":"🔡","text_ar":"حروف صغيرة بدون علامات","text_en":"all lowercase no punctuation","trait_weights":{}},
   {"id":"c","emoji":"😂🔥💀","text_ar":"إيموجيات زيادة","text_en":"way too many emojis","trait_weights":{"humor":0.6}},
   {"id":"d","emoji":"👍","text_ar":"كلمة وحدة بس","text_en":"One-word replies","trait_weights":{}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'running_late', 'chaotic',
 'لو تأخرت…', 'If I''m running late…', 1,
 '[{"id":"a","emoji":"🏃","text_ar":"أركض","text_en":"Sprint","trait_weights":{"energy":0.6}},
   {"id":"b","emoji":"🚶","text_ar":"أمشي عادي","text_en":"Casually stroll in","trait_weights":{"confidence":0.4}},
   {"id":"c","emoji":"🚗","text_ar":"ألوم الزحمة","text_en":"Blame traffic","trait_weights":{"humor":0.4}},
   {"id":"d","emoji":"🙅","text_ar":"ما أجي خلاص","text_en":"Just don''t show up","trait_weights":{"humor":0.5}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'biggest_fear', 'deep',
 'أكبر خوف عندي…', 'My biggest fear…', 1,
 '[{"id":"a","emoji":"🎤","text_ar":"التكلم قدام الناس","text_en":"Public speaking","trait_weights":{}},
   {"id":"b","emoji":"🕷️","text_ar":"الحشرات","text_en":"Bugs/spiders","trait_weights":{}},
   {"id":"c","emoji":"📶","text_ar":"يخلص النت","text_en":"Running out of data","trait_weights":{"humor":0.4}},
   {"id":"d","emoji":"🤐","text_ar":"السكوت المحرج","text_en":"Awkward silence","trait_weights":{}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'humor_style', 'funny',
 'نوع ضحكي…', 'My humor is…', 1,
 '[{"id":"a","emoji":"😏","text_ar":"ساخر","text_en":"Sarcastic","trait_weights":{"humor":0.7}},
   {"id":"b","emoji":"🌀","text_ar":"عشوائي وفوضوي","text_en":"Random chaos","trait_weights":{"humor":0.8,"adventure":0.4}},
   {"id":"c","emoji":"🖤","text_ar":"أسود","text_en":"Dark comedy","trait_weights":{"humor":0.6}},
   {"id":"d","emoji":"😇","text_ar":"لطيف وبسيط","text_en":"Wholesome dad jokes","trait_weights":{"kindness":0.5,"humor":0.4}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'money_habits', 'mixed',
 'بفلوسي أنا…', 'With money I…', 1,
 '[{"id":"a","emoji":"💰","text_ar":"أوفر كل ريال","text_en":"Save every riyal","trait_weights":{"organization":0.7,"responsibility":0.6}},
   {"id":"b","emoji":"🛍️","text_ar":"أصرفه بنفس اليوم","text_en":"Spend it same day","trait_weights":{"adventure":0.4}},
   {"id":"c","emoji":"🤷","text_ar":"أنسى إني عندي فلوس","text_en":"Forget I have it","trait_weights":{}},
   {"id":"d","emoji":"📊","text_ar":"عندي جدول ميزانية","text_en":"Budget spreadsheet nerd","trait_weights":{"organization":0.8}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'playlist', 'funny',
 'بلاي لست…', 'My playlist…', 1,
 '[{"id":"a","emoji":"🔁","text_ar":"نفس ٥ أغاني للأبد","text_en":"Same 5 songs forever","trait_weights":{}},
   {"id":"b","emoji":"📈","text_ar":"اللي ترند","text_en":"Whatever''s trending","trait_weights":{}},
   {"id":"c","emoji":"🎧","text_ar":"نوعي خاص وفخور فيه","text_en":"Niche and proud","trait_weights":{"confidence":0.5}},
   {"id":"d","emoji":"🌪️","text_ar":"خليط فوضى","text_en":"Total chaos mix","trait_weights":{"humor":0.4}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'decisions', 'mixed',
 'أخذ القرارات…', 'Decision making…', 1,
 '[{"id":"a","emoji":"🤯","text_ar":"أفكر زيادة","text_en":"Overthink everything","trait_weights":{"responsibility":0.4}},
   {"id":"b","emoji":"⚡","text_ar":"أمشي مع إحساسي","text_en":"Go with gut","trait_weights":{"confidence":0.5,"adventure":0.4}},
   {"id":"c","emoji":"💬","text_ar":"أسأل القروب","text_en":"Ask the group chat","trait_weights":{"kindness":0.5}},
   {"id":"d","emoji":"🪙","text_ar":"أرمي عملة","text_en":"Flip a coin","trait_weights":{"humor":0.5}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'gaming', 'funny',
 'بالقيمز أنا…', 'In video games I''m…', 1,
 '[{"id":"a","emoji":"🔥","text_ar":"تنافسي زيادة","text_en":"Competitive rager","trait_weights":{"energy":0.6,"confidence":0.5}},
   {"id":"b","emoji":"🌿","text_ar":"أستكشف بهدوء","text_en":"Chill explorer","trait_weights":{"kindness":0.4}},
   {"id":"c","emoji":"🎮","text_ar":"أدق كل الأزرار","text_en":"Button masher","trait_weights":{"humor":0.4}},
   {"id":"d","emoji":"😤","text_ar":"أطلع من اللعبة زعلان","text_en":"Rage quit champion","trait_weights":{"humor":0.5}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'winning', 'funny',
 'لو فزت بجايزة بسيطة…', 'If I win a small prize…', 1,
 '[{"id":"a","emoji":"📢","text_ar":"أفتخر على طول","text_en":"Brag immediately","trait_weights":{"confidence":0.6}},
   {"id":"b","emoji":"😌","text_ar":"أتواضع","text_en":"Act humble","trait_weights":{"kindness":0.5}},
   {"id":"c","emoji":"🤝","text_ar":"أشارك أصحابي","text_en":"Share with friends","trait_weights":{"kindness":0.6}},
   {"id":"d","emoji":"🤔","text_ar":"أنسى إني فزت","text_en":"Forget I won","trait_weights":{}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'party_energy', 'funny',
 'بالحفلات أنا…', 'My energy at parties…', 1,
 '[{"id":"a","emoji":"📢","text_ar":"الأعلى صوت","text_en":"The loudest one","trait_weights":{"confidence":0.6,"energy":0.6}},
   {"id":"b","emoji":"👀","text_ar":"أراقب بهدوء","text_en":"Quiet observer","trait_weights":{}},
   {"id":"c","emoji":"💃","text_ar":"أرقص بدون توقف","text_en":"Dancing non-stop","trait_weights":{"energy":0.7}},
   {"id":"d","emoji":"🚪","text_ar":"طلعت من ٢٠ دقيقة","text_en":"Left after 20 minutes","trait_weights":{}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'homework', 'mixed',
 'الواجبات…', 'Homework…', 1,
 '[{"id":"a","emoji":"✅","text_ar":"أسويها أول شي","text_en":"Do it first thing","trait_weights":{"organization":0.7,"responsibility":0.6}},
   {"id":"b","emoji":"🕐","text_ar":"أأجلها للنهاية","text_en":"Procrastinate to the max","trait_weights":{}},
   {"id":"c","emoji":"👥","text_ar":"أنسخ الجو مو الجواب","text_en":"Copy the vibe not the answers","trait_weights":{"humor":0.5}},
   {"id":"d","emoji":"📖","text_ar":"أستمتع فيها فعلاً","text_en":"Actually enjoy it","trait_weights":{"responsibility":0.5}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'spicy_food', 'funny',
 'الأكل الحار…', 'My reaction to spicy food…', 1,
 '[{"id":"a","emoji":"🌶️","text_ar":"أحب الحرقان","text_en":"Love the pain","trait_weights":{"adventure":0.5}},
   {"id":"b","emoji":"😅","text_ar":"لقمة وخلاص","text_en":"One bite and done","trait_weights":{}},
   {"id":"c","emoji":"😎","text_ar":"أكذب إني أحبه","text_en":"Lie about liking it","trait_weights":{"humor":0.5}},
   {"id":"d","emoji":"🥛","text_ar":"جاهز بالحليب من قبل","text_en":"Prepared with milk already","trait_weights":{"organization":0.4}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'road_trips', 'mixed',
 'بالرحلات البرية…', 'On road trips I''m…', 1,
 '[{"id":"a","emoji":"🎵","text_ar":"مسؤول الأغاني","text_en":"DJ control","trait_weights":{}},
   {"id":"b","emoji":"😴","text_ar":"أنام بأول ٥ دقايق","text_en":"Falls asleep in 5 min","trait_weights":{}},
   {"id":"c","emoji":"🗺️","text_ar":"مسؤول الطريق","text_en":"Navigator","trait_weights":{"organization":0.5,"responsibility":0.4}},
   {"id":"d","emoji":"🍫","text_ar":"مسؤول السناكس","text_en":"Snack manager","trait_weights":{"kindness":0.4}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'closet', 'funny',
 'خزانتي…', 'My closet…', 1,
 '[{"id":"a","emoji":"👕","text_ar":"نفس الإطلالة تتكرر","text_en":"Same outfit repeated","trait_weights":{}},
   {"id":"b","emoji":"✨","text_ar":"إطلالة جديدة كل يوم","text_en":"New fit everyday","trait_weights":{"confidence":0.5}},
   {"id":"c","emoji":"⚫","text_ar":"كله أسود","text_en":"All black everything","trait_weights":{}},
   {"id":"d","emoji":"👖","text_ar":"مستعير من صاحبي","text_en":"Borrowed from a friend","trait_weights":{"humor":0.5}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'selfies', 'funny',
 'بصور القروب…', 'Group selfies I''m…', 1,
 '[{"id":"a","emoji":"📸","text_ar":"زاويتي مضبوطة دايم","text_en":"Perfect angle every time","trait_weights":{"confidence":0.5}},
   {"id":"b","emoji":"😜","text_ar":"أخرب كل صورة","text_en":"Photobomb everyone","trait_weights":{"humor":0.6}},
   {"id":"c","emoji":"😑","text_ar":"عيني دايم مغمضة","text_en":"Never blink right","trait_weights":{"humor":0.4}},
   {"id":"d","emoji":"🔁","text_ar":"آخذ ٤٧ محاولة","text_en":"Take 47 retakes","trait_weights":{"organization":0.3}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'study_playlist', 'mixed',
 'وقت المذاكرة…', 'My study playlist is…', 1,
 '[{"id":"a","emoji":"🤫","text_ar":"سكوت تام","text_en":"Total silence","trait_weights":{"organization":0.4}},
   {"id":"b","emoji":"🎧","text_ar":"لوفاي هادي","text_en":"Lo-fi beats","trait_weights":{}},
   {"id":"c","emoji":"🔊","text_ar":"موسيقى صاخبة","text_en":"Loud music","trait_weights":{"energy":0.4}},
   {"id":"d","emoji":"📺","text_ar":"التلفزيون بالخلفية","text_en":"Background TV","trait_weights":{}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'wifi_down', 'funny',
 'إذا انقطع النت…', 'If the wifi goes down…', 1,
 '[{"id":"a","emoji":"😐","text_ar":"هدوء بسيط","text_en":"Mild panic","trait_weights":{}},
   {"id":"b","emoji":"🚨","text_ar":"أزمة حقيقية","text_en":"True crisis","trait_weights":{"humor":0.5}},
   {"id":"c","emoji":"🌳","text_ar":"أطلع برا (بصراحة صدمة)","text_en":"Go outside (shocking)","trait_weights":{"adventure":0.4}},
   {"id":"d","emoji":"🔁","text_ar":"أعيد تشغيل الراوتر ١٢ مرة","text_en":"Restart the router 12 times","trait_weights":{}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'sleep_schedule', 'mixed',
 'نظام نومي…', 'My sleep schedule…', 1,
 '[{"id":"a","emoji":"🌅","text_ar":"أصحى بدري","text_en":"Early bird","trait_weights":{"organization":0.5}},
   {"id":"b","emoji":"🌙","text_ar":"بومة ليل","text_en":"Night owl","trait_weights":{}},
   {"id":"c","emoji":"🎢","text_ar":"كله فوضى","text_en":"All over the place","trait_weights":{}},
   {"id":"d","emoji":"😴","text_ar":"بطل القيلولة","text_en":"Nap champion","trait_weights":{}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'sports', 'funny',
 'بالرياضة أنا…', 'In sports I''m…', 1,
 '[{"id":"a","emoji":"🔥","text_ar":"تنافسي زيادة","text_en":"All in competitive","trait_weights":{"energy":0.6,"confidence":0.5}},
   {"id":"b","emoji":"🍿","text_ar":"بس أجي عشان الأكل","text_en":"Just here for snacks","trait_weights":{"humor":0.5}},
   {"id":"c","emoji":"🤕","text_ar":"إصابة بانتظارها","text_en":"Injury waiting to happen","trait_weights":{"humor":0.5}},
   {"id":"d","emoji":"🪑","text_ar":"قاعد على الكرسي بالاختيار","text_en":"Benched by choice","trait_weights":{}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'notifications', 'funny',
 'إشعارات جوالي…', 'My notifications…', 1,
 '[{"id":"a","emoji":"✅","text_ar":"أمسحها فورًا","text_en":"Cleared instantly","trait_weights":{"organization":0.5}},
   {"id":"b","emoji":"🔴","text_ar":"999+ ماقريتها","text_en":"999+ unread","trait_weights":{}},
   {"id":"c","emoji":"👀","text_ar":"أرد على ناس معينين بس","text_en":"Only replies to some people","trait_weights":{}},
   {"id":"d","emoji":"✈️","text_ar":"وضع الطيران أغلب الوقت","text_en":"Airplane mode most days","trait_weights":{}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'embarrassment', 'funny',
 'إذا صار موقف محرج…', 'If something embarrassing happens…', 1,
 '[{"id":"a","emoji":"😂","text_ar":"أضحك عليه","text_en":"Laugh it off","trait_weights":{"humor":0.6}},
   {"id":"b","emoji":"😩","text_ar":"أتذكره للأبد","text_en":"Relive it forever","trait_weights":{}},
   {"id":"c","emoji":"👉","text_ar":"ألوم شخص ثاني","text_en":"Blame someone else","trait_weights":{"humor":0.5}},
   {"id":"d","emoji":"🙈","text_ar":"أتظاهر إنه ماصار","text_en":"Pretend it didn''t happen","trait_weights":{}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'handwriting', 'mixed',
 'خطي…', 'My handwriting is…', 1,
 '[{"id":"a","emoji":"✍️","text_ar":"مرتب ونظيف","text_en":"Neat and tidy","trait_weights":{"organization":0.5}},
   {"id":"b","emoji":"🌀","text_ar":"فوضى تامة","text_en":"Total chaos","trait_weights":{}},
   {"id":"c","emoji":"🔠","text_ar":"كله حروف كبيرة","text_en":"All caps always","trait_weights":{}},
   {"id":"d","emoji":"🔄","text_ar":"يتغير كل مرة","text_en":"Different every time","trait_weights":{}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'planning_hangout', 'mixed',
 'لو نطلع سوا…', 'Planning a hangout, I''m…', 1,
 '[{"id":"a","emoji":"📋","text_ar":"المنظم","text_en":"The organizer","trait_weights":{"organization":0.7,"leadership":0.5}},
   {"id":"b","emoji":"🤷","text_ar":"أجي أي وقت","text_en":"Shows up whenever","trait_weights":{}},
   {"id":"c","emoji":"😅","text_ar":"أنسى إن فيه خطة","text_en":"Forgets the plan exists","trait_weights":{}},
   {"id":"d","emoji":"🔄","text_ar":"أغير الخطة بآخر لحظة","text_en":"Changes it last minute","trait_weights":{}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'scary_movies', 'funny',
 'أفلام الرعب…', 'My reaction to scary movies…', 1,
 '[{"id":"a","emoji":"😱","text_ar":"أصرخ الأعلى","text_en":"Screams the loudest","trait_weights":{"humor":0.5}},
   {"id":"b","emoji":"😐","text_ar":"ما يأثر فيني شي","text_en":"Totally unbothered","trait_weights":{"confidence":0.5}},
   {"id":"c","emoji":"🙈","text_ar":"أختبي خلف مخدة","text_en":"Hides behind a pillow","trait_weights":{}},
   {"id":"d","emoji":"🗣️","text_ar":"أسولف طول الفلم","text_en":"Narrates the whole thing","trait_weights":{"humor":0.5}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'class_participation', 'mixed',
 'بالفصل…', 'Class participation…', 1,
 '[{"id":"a","emoji":"🙋","text_ar":"أرفع يدي أول واحد","text_en":"Raises hand first","trait_weights":{"confidence":0.5,"leadership":0.4}},
   {"id":"b","emoji":"👀","text_ar":"أتجنب أي تواصل بالعين","text_en":"Avoids eye contact","trait_weights":{}},
   {"id":"c","emoji":"🎯","text_ar":"أجاوب بس لو سألوني","text_en":"Answers only when called","trait_weights":{}},
   {"id":"d","emoji":"🤫","text_ar":"أعرف كل شي بس ما أحچي","text_en":"Knows everything, says nothing","trait_weights":{}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'aesthetic', 'mixed',
 'ستايلي…', 'My "aesthetic" is…', 1,
 '[{"id":"a","emoji":"🤍","text_ar":"بسيط ونظيف","text_en":"Clean minimalist","trait_weights":{"organization":0.5}},
   {"id":"b","emoji":"🌈","text_ar":"فوضى ألوان","text_en":"Maximalist chaos","trait_weights":{"humor":0.4}},
   {"id":"c","emoji":"😌","text_ar":"أي شي مريح","text_en":"Whatever''s comfortable","trait_weights":{"kindness":0.3}},
   {"id":"d","emoji":"🔁","text_ar":"أنسخ اللي يصير ترند","text_en":"Copies whoever''s cool that week","trait_weights":{}}]');

-- ----------------------------------------------------------------------------
-- ROUND 2 — FRIEND_VOTE ("who's most likely to..."). 35 in the bank; each
-- session randomly shows 13 (Round2.tsx's seededShuffle().slice(0,13)).
-- ----------------------------------------------------------------------------
insert into questions (pack_id, round, question_type, category, difficulty, text_ar, text_en, weight, options) values
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'become_millionaire', 'mixed', 'يصير مليونير', 'Become a millionaire', 1, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'go_viral_accident', 'funny', 'يصير فيروسي بالغلط', 'Go viral by accident', 1, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'forget_own_number', 'funny', 'ينسى رقم جواله', 'Forget their own phone number', 0.8, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'start_business_no_plan', 'mixed', 'يفتح مشروع بدون خطة', 'Start a business with zero plan', 1, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'late_own_party', 'chaotic', 'يتأخر عن حفلته', 'Be late to their own party', 1, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'cry_movie_deny', 'deep', 'يبچي بفلم وينكر', 'Cry during a movie and deny it', 0.8, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'lost_with_gps', 'funny', 'يضيع وعنده خرائط', 'Get lost using GPS', 0.8, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'eat_pizza_alone', 'funny', 'ياكل بيتزا كاملة لحاله', 'Eat an entire pizza alone', 0.8, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'talk_out_of_trouble', 'mixed', 'يقنعك بأي شي', 'Talk their way out of trouble', 1, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'sleep_anywhere2', 'funny', 'ينام بأي مكان', 'Fall asleep literally anywhere', 0.8, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'start_drama_gc', 'chaotic', 'يسوي دراما بالقروب', 'Start drama in the group chat', 1, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'forget_birthday', 'mixed', 'ينسى عيد ميلاد صاحبه', 'Forget a friend''s birthday', 0.8, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'famous_random', 'funny', 'يشتهر بشي غريب', 'Become famous for something random', 1, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'win_argument_lie', 'chaotic', 'يربح نقاش بكذبة بوجه جاد', 'Win an argument with a straight-face lie', 0.8, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'break_screen', 'funny', 'يكسر شاشة جواله هالسنة', 'Break their phone screen this year', 0.6, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'pro_gamer', 'mixed', 'يصير قيمر محترف', 'Become a professional gamer', 0.8, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'adopt_pets', 'funny', 'يربي حيوانات أكثر من اللازم', 'Adopt way too many pets', 0.6, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'snitch_plan', 'chaotic', 'يفشي سر خطة القروب', 'Snitch on the group''s secret plan', 0.8, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'survive_zombie', 'funny', 'يعيش بنهاية العالم الزومبي', 'Survive a zombie apocalypse', 1, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'kicked_group', 'chaotic', 'ينطرد من القروب', 'Get kicked out of a group chat', 0.8, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'sleep_5_alarms', 'funny', 'ينام على ٥ منبهات', 'Sleep through 5 alarms', 0.8, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'influencer_overnight', 'mixed', 'يصير مشهور بليلة وضحاها', 'Become an influencer overnight', 1, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'scroll_4am', 'funny', 'يضل يمرر بجواله الساعة ٤ الفجر', 'Still be scrolling at 4am', 0.8, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'get_scammed', 'mixed', 'ينحتال عليه أونلاين', 'Get scammed online', 0.8, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'conspiracy_fun', 'chaotic', 'يبدأ نظرية مؤامرة للمزح', 'Start a conspiracy theory for fun', 0.8, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'never_grow_up', 'deep', 'ما يكبر أبد', 'Never actually grow up', 0.8, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'laugh_wrong_time', 'chaotic', 'يضحك بأسوأ وقت', 'Laugh at the worst possible moment', 0.8, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'remember_embarrassing', 'funny', 'يتذكر كل موقف محرج صار', 'Remember every embarrassing thing that happened', 0.8, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'cancel_last_minute', 'chaotic', 'يلغي الخطط بآخر لحظة', 'Cancel plans last minute (again)', 1, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'mom_dad_friend', 'mixed', 'يصير الأم أو الأب بالقروب', 'Become the "mom/dad friend" of the group', 1, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'random_tattoo', 'chaotic', 'يسوي وشم عشوائي بتحدي', 'Get a random tattoo on a dare', 0.8, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'win_without_trying', 'mixed', 'يفوز بدون لا يحاول', 'Win something without even trying', 0.8, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'talk_in_sleep', 'funny', 'يحچي وهو نايم', 'Talk in their sleep', 0.6, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'stand_up_comedian', 'mixed', 'يصير كوميديان', 'Become a stand-up comedian', 1, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'lost_shortcut', 'chaotic', 'يضيع الكل بطريق مختصر', 'Get everyone lost on a "shortcut"', 0.8, '[]');

-- ----------------------------------------------------------------------------
-- ROUND 3 — HOT_TAKE (agree/disagree). 10 in the bank; each session randomly
-- shows 3 (Round3.tsx's seededShuffle().slice(0,3)). Names/avatars are shown
-- per response at Results — hot_take_responses is intentionally readable by
-- any session member (see hot_take_responses RLS), unlike votes.
-- ----------------------------------------------------------------------------
insert into questions (pack_id, round, question_type, category, difficulty, text_ar, text_en, weight, options) values
('11111111-1111-1111-1111-111111111111', 3, 'hot_take', 'food_opinions', 'funny',
 'الأناناس مكانه على البيتزا', 'Pineapple belongs on pizza', 1, '[{"id":"a","emoji":"🍍"}]'),
('11111111-1111-1111-1111-111111111111', 3, 'hot_take', 'media_opinions', 'mixed',
 'الفلم دايم أحسن من الكتاب', 'The movie is always better than the book', 1, '[{"id":"a","emoji":"🎬"}]'),
('11111111-1111-1111-1111-111111111111', 3, 'hot_take', 'social_habits', 'funny',
 'اللايك على الستوري مو تواصل حقيقي', 'Liking a story doesn''t count as "keeping in touch"', 1, '[{"id":"a","emoji":"📱"}]'),
('11111111-1111-1111-1111-111111111111', 3, 'hot_take', 'social_habits', 'funny',
 'إذا أخذت أكثر من ٣ سيلفي قبل ما تنشر وحدة، فأنت غير واثق من نفسك', 'If you take more than 3 selfies before posting one, you''re insecure', 1, '[{"id":"a","emoji":"🤳"}]'),
('11111111-1111-1111-1111-111111111111', 3, 'hot_take', 'personality', 'chaotic',
 'كل شخص يقول "ما يهمني رأي الناس" هو أكثر وحد يهمه رأي الناس', 'Everyone who says "I don''t care what people think" cares the most', 1, '[{"id":"a","emoji":"🧢"}]'),
('11111111-1111-1111-1111-111111111111', 3, 'hot_take', 'food_opinions', 'funny',
 'الكيك الجاهز من المحل دايم أحسن من كيك البيت', 'Store-bought cake is always better than homemade, don''t lie', 1, '[{"id":"a","emoji":"🎂"}]'),
('11111111-1111-1111-1111-111111111111', 3, 'hot_take', 'chaotic_opinions', 'chaotic',
 'اللي يمشون ببطء بمجموعة لازم يتغرمون', 'People who walk slow in groups should get fined', 1, '[{"id":"a","emoji":"🐌"}]'),
('11111111-1111-1111-1111-111111111111', 3, 'hot_take', 'social_habits', 'mixed',
 'إعادة إهداء الهدية ذكاء مو قلة ذوق', 'Re-gifting is smart, not rude', 1, '[{"id":"a","emoji":"🎁"}]'),
('11111111-1111-1111-1111-111111111111', 3, 'hot_take', 'food_opinions', 'funny',
 'البطاطس زينة بس أول ١٠ دقايق، بعدها الكل يكذب', 'Fries are only good in the first 10 minutes, everyone''s lying after that', 1, '[{"id":"a","emoji":"🍟"}]'),
('11111111-1111-1111-1111-111111111111', 3, 'hot_take', 'social_habits', 'funny',
 'الحچي وقت الفلم شي حلو ومافيه مشكلة', 'Talking during a movie is actually fun and okay', 1, '[{"id":"a","emoji":"🍿"}]');


-- ----------------------------------------------------------------------------
-- ROUND 4 — WILDCARD (Would You Rather + fill-in-the-blank). 24 in the bank
-- (14 this_or_that + 10 open_text); each session randomly shows 8, mixed
-- type (Round4.tsx's seededShuffle().slice(0,8)). Would You Rather reuses
-- the private `answers` table like Round 1. Fill-in-the-blank writes to
-- `text_responses`, readable by any session member — same reveal-at-Results
-- privacy model as hot_take_responses.
-- ----------------------------------------------------------------------------
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
 'لو نزلت المخلوقات الفضائية باچر، أول شي بسويه هو ___', 'If aliens landed tomorrow, my first move would be to ___', 1, '[{"id":"a","emoji":"👽"}]');

-- ----------------------------------------------------------------------------
-- SCORE FORMULAS — one per trait, purely from Round 1 trait_weights (no
-- category filter — see migration_007 for why).
-- ----------------------------------------------------------------------------
insert into score_formulas (trait_key, name_ar, name_en, components) values
('leadership', 'القيادة', 'Leadership', '[{"source":"self_answers","weight":1}]'),
('humor', 'الفكاهة', 'Humor', '[{"source":"self_answers","weight":1}]'),
('energy', 'الطاقة', 'Energy', '[{"source":"self_answers","weight":1}]'),
('organization', 'التنظيم', 'Organization', '[{"source":"self_answers","weight":1}]'),
('adventure', 'المغامرة', 'Adventure', '[{"source":"self_answers","weight":1}]'),
('kindness', 'اللطف', 'Kindness', '[{"source":"self_answers","weight":1}]'),
('confidence', 'الثقة', 'Confidence', '[{"source":"self_answers","weight":1}]'),
('responsibility', 'المسؤولية', 'Responsibility', '[{"source":"self_answers","weight":1}]');

-- ----------------------------------------------------------------------------
-- AWARDS
-- ----------------------------------------------------------------------------
insert into awards (slug, emoji, name_ar, name_en, description_ar, description_en, rule, sort_order) values
('ceo', '👑', 'الرئيس التنفيذي', 'The CEO', 'أعلى نتيجة قيادة بالقروب', 'Highest leadership score in the group',
 '{"type":"top_trait","trait_key":"leadership"}', 1),
('chaos_generator', '😂', 'صانع الفوضى', 'Chaos Generator', 'الأكثر تصويتًا لبدء الدراما', 'Most votes for starting group-chat drama',
 '{"type":"top_vote_category","category":"start_drama_gc"}', 2),
('walking_wikipedia', '🧠', 'ويكيبيديا الماشية', 'Walking Wikipedia', 'أعلى نتيجة مسؤولية', 'Highest responsibility score',
 '{"type":"top_trait","trait_key":"responsibility"}', 3),
('future_billionaire', '💰', 'مليونير المستقبل', 'Future Billionaire', 'الأكثر تصويتًا ليصير مليونير', 'Most votes to become a millionaire',
 '{"type":"top_vote_category","category":"become_millionaire"}', 4),
('main_character', '📸', 'الشخصية الرئيسية', 'Main Character', 'الأكثر تصويتًا ليشتهر بشي غريب', 'Most votes to become randomly famous',
 '{"type":"top_vote_category","category":"famous_random"}', 5),
('gym_hero', '🏋️', 'بطل الجيم', 'Gym Hero', 'أعلى نتيجة طاقة', 'Highest energy score',
 '{"type":"top_trait","trait_key":"energy"}', 6),
('adventurer', '🌎', 'المغامر', 'Adventurer', 'أعلى نتيجة مغامرة', 'Highest adventure score',
 '{"type":"top_trait","trait_key":"adventure"}', 7),
('most_reliable', '🎯', 'الأكثر موثوقية', 'Most Reliable', 'أعلى نتيجة مسؤولية ولطف', 'Highest combined responsibility & kindness',
 '{"type":"top_trait_combo","trait_keys":["responsibility","kindness"]}', 8),
('future_influencer', '📱', 'مؤثر المستقبل', 'Future Influencer', 'الأكثر تصويتًا ليصير مشهور بليلة', 'Most votes to become an influencer overnight',
 '{"type":"top_vote_category","category":"influencer_overnight"}', 9),
('survivor', '🧟', 'الناجي', 'The Survivor', 'الأكثر تصويتًا للنجاة من الزومبي', 'Most votes to survive a zombie apocalypse',
 '{"type":"top_vote_category","category":"survive_zombie"}', 10),
('comedian', '🎤', 'الكوميدي', 'The Comedian', 'الأكثر تصويتًا ليصير كوميديان', 'Most votes to become a stand-up comedian',
 '{"type":"top_vote_category","category":"stand_up_comedian"}', 11),
('big_spender', '🛍️', 'المسرف', 'Big Spender', 'اختار "أصرفه بنفس اليوم" الأكثر', 'Picked "spend it same day" most often',
 '{"type":"top_self_category","category":"money_habits","option_id":"b"}', 12),
('night_owl', '🌙', 'بومة الليل', 'Night Owl', 'اختار "بومة ليل" الأكثر', 'Picked "night owl" most often',
 '{"type":"top_self_category","category":"sleep_schedule","option_id":"b"}', 13);

-- ----------------------------------------------------------------------------
-- RESULT TEMPLATES — Results Engine building blocks (no AI, no API).
-- ----------------------------------------------------------------------------
insert into result_templates (template_type, conditions, text_ar, text_en, weight) values
('summary_opener', '[{"trait":"energy","op":">","value":80}]',
 'أنت شرارة القروب 🔥', 'You''re the spark of the group 🔥', 1),
('summary_opener', '[{"trait":"leadership","op":">","value":80}]',
 'واضح إنك القائد الطبيعي بالشلة.', 'You''re clearly the group''s natural leader.', 1),
('summary_opener', '[{"trait":"humor","op":">","value":80}]',
 'ما فيه تجمع يضحك بدونك.', 'No hangout is funny without you.', 1),
('summary_opener', '[{"trait":"organization","op":"<","value":40}]',
 'الخطط عندك اقتراحات، مو قوانين 😅', 'Plans are more of a suggestion to you 😅', 1),

('summary_trait', '[{"trait":"humor","op":">","value":80}]',
 'طاقتك عالية وحسك الفكاهي ما يخلص، دايم جاهز لأي مغامرة جديدة.',
 'Your energy is high and your humor never runs out — always ready for the next adventure.', 1),
('summary_trait', '[{"trait":"kindness","op":">","value":80}]',
 'أصحابك يعرفون إنك ما تخذلهم، ودايم حاضر وقت الجد.',
 'Your friends know you never let them down, and you show up when it matters.', 1),
('summary_trait', '[{"trait":"adventure","op":">","value":75}]',
 'أي خطة عفوية، أنت أول واحد يوافق عليها.',
 'Any spontaneous plan, you''re the first to say yes.', 1),
('summary_trait', '[{"trait":"kindness","op":">","value":75}]',
 'دايم تحس بمشاعر الكل قبل لا أحد يقول شي.',
 'You pick up on how everyone''s feeling before anyone says a word.', 1),

('summary_closer', '[{"trait":"adventure","op":">","value":60}]',
 'أصحابك يعتمدون عليك لأنك موثوق، بس بنفس الوقت يعرفون إنك بتقنعهم يسوّون شي عفوي فجأة 😄',
 'Your friends count on you because you''re dependable, but they also know you''ll talk them into something spontaneous 😄', 1),
('summary_closer', '[{"trait":"organization","op":">","value":70}]',
 'من دونك، ولا رحلة وحدة كانت بتصير 😂', 'Without you, not a single trip would have actually happened 😂', 1),
('summary_closer', '[]',
 'باختصار، القروب ما يكتمل بدونك.', 'Bottom line — the group isn''t complete without you.', 0.5),

('hidden_stat', '[{"vote_category":"survive_zombie","op":">","value":50}]',
 '{percent}% احتمال تصمد بنهاية العالم الزومبي', '{percent}% chance you''d survive a zombie apocalypse', 1),
('hidden_stat', '[{"vote_category":"become_millionaire","op":">","value":30}]',
 '{percent}% متأكدين إنك بتصير مليونير', '{percent}% are sure you''ll become a millionaire', 1),
('hidden_stat', '[{"vote_category":"famous_random","op":">","value":30}]',
 '{percent}% احتمال تشتهر بشي غريب', '{percent}% chance you go randomly famous', 1);

-- ----------------------------------------------------------------------------
-- DEFAULT SETTINGS
-- ----------------------------------------------------------------------------
insert into settings (key, value) values
('default_pack', '"friends"'),
('min_players_to_start', '2'),
('max_players_default', '8'),
('rounds_enabled', '[1,2,3,4]'),
('safety_no_appearance_awards', 'true'),
('safety_no_political_religious_questions', 'true');
