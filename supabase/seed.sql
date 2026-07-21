-- ============================================================================
-- BAGDOONIS — seed data for the "Friends" pack (v1)
-- Run after schema.sql. Expand any of these tables freely later —
-- the app never needs a redeploy to add a question, award, or template.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PACK
-- ----------------------------------------------------------------------------
insert into question_packs (id, slug, icon, name_ar, name_en, description_ar, description_en, sort_order)
values ('11111111-1111-1111-1111-111111111111', 'friends', '👯', 'الأصدقاء', 'Friends',
        'الباقة الأساسية لأي شلة', 'The default pack for any friend group', 1);

-- ----------------------------------------------------------------------------
-- ROUND 1 — SELF  (emoji multiple choice, trait_weights feed the scoring engine)
-- ----------------------------------------------------------------------------
insert into questions (pack_id, round, question_type, category, difficulty, text_ar, text_en, weight, options) values
('11111111-1111-1111-1111-111111111111', 1, 'self', 'temperament', 'funny',
 'أنا غالبًا…', 'I''m usually…', 1,
 '[{"id":"a","emoji":"😂","text_ar":"أضحك","text_en":"Laughing","trait_weights":{"humor":0.8}},
   {"id":"b","emoji":"😐","text_ar":"أراقب","text_en":"Watching","trait_weights":{"organization":0.5}},
   {"id":"c","emoji":"😴","text_ar":"أنام","text_en":"Sleeping","trait_weights":{"energy":-0.4}},
   {"id":"d","emoji":"🤯","text_ar":"أفكر زيادة","text_en":"Overthinking","trait_weights":{"responsibility":0.4}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'travel_style', 'funny',
 'أنا إذا سافرت…', 'When I travel…', 1,
 '[{"id":"a","emoji":"🗺️","text_ar":"أخطط","text_en":"I plan","trait_weights":{"organization":0.8}},
   {"id":"b","emoji":"🎲","text_ar":"أرتجل","text_en":"I improvise","trait_weights":{"adventure":0.7}},
   {"id":"c","emoji":"🌀","text_ar":"أضيع","text_en":"I get lost","trait_weights":{"adventure":0.5,"organization":-0.4}},
   {"id":"d","emoji":"💤","text_ar":"أنام بالطريق","text_en":"I sleep the trip","trait_weights":{"energy":-0.3}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'spending', 'mixed',
 'أكثر شيء أصرف عليه…', 'I spend the most on…', 1,
 '[{"id":"a","emoji":"☕","text_ar":"قهوة","text_en":"Coffee","trait_weights":{}},
   {"id":"b","emoji":"🍔","text_ar":"أكل","text_en":"Food","trait_weights":{}},
   {"id":"c","emoji":"🚗","text_ar":"سيارات","text_en":"Cars","trait_weights":{"confidence":0.4}},
   {"id":"d","emoji":"✈️","text_ar":"سفر","text_en":"Travel","trait_weights":{"adventure":0.6}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'identity', 'mixed',
 'أنا شخص…', 'I''m someone who''s…', 1.2,
 '[{"id":"a","emoji":"🧘","text_ar":"هادئ","text_en":"Calm","trait_weights":{"kindness":0.5}},
   {"id":"b","emoji":"🎯","text_ar":"قيادي","text_en":"A leader","trait_weights":{"leadership":0.9}},
   {"id":"c","emoji":"🏔️","text_ar":"مغامر","text_en":"Adventurous","trait_weights":{"adventure":0.9}},
   {"id":"d","emoji":"🌪️","text_ar":"فوضوي","text_en":"Chaotic","trait_weights":{"organization":-0.7}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'money', 'deep',
 'لو صار عندي مليون ريال…', 'If I had a million…', 1,
 '[{"id":"a","emoji":"💼","text_ar":"أستثمره","text_en":"Invest it","trait_weights":{"responsibility":0.7}},
   {"id":"b","emoji":"🛍️","text_ar":"أصرفه","text_en":"Spend it","trait_weights":{"confidence":0.4}},
   {"id":"c","emoji":"✈️","text_ar":"أسافر","text_en":"Travel","trait_weights":{"adventure":0.5}},
   {"id":"d","emoji":"🏠","text_ar":"أشتري بيت","text_en":"Buy a house","trait_weights":{"organization":0.5}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'crisis', 'deep',
 'وقت الأزمات أنا…', 'In a crisis I''m…', 1.2,
 '[{"id":"a","emoji":"🧯","text_ar":"أحل المشكلة","text_en":"The fixer","trait_weights":{"leadership":0.7,"responsibility":0.6}},
   {"id":"b","emoji":"😅","text_ar":"أتوتر","text_en":"The panicker","trait_weights":{"confidence":-0.4}},
   {"id":"c","emoji":"📵","text_ar":"أختفي","text_en":"The vanisher","trait_weights":{"loyalty":-0.5}},
   {"id":"d","emoji":"🎬","text_ar":"أوثّق الموقف","text_en":"The filmer","trait_weights":{"humor":0.5}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'pet_peeve', 'mixed',
 'أكثر شيء يضيّق علي…', 'What annoys me most…', 0.8,
 '[{"id":"a","emoji":"⏰","text_ar":"التأخير","text_en":"Being late","trait_weights":{"organization":0.4}},
   {"id":"b","emoji":"📱","text_ar":"التجاهل","text_en":"Being ignored","trait_weights":{"loyalty":0.4}},
   {"id":"c","emoji":"🗣️","text_ar":"الدراما","text_en":"Drama","trait_weights":{"kindness":0.4}},
   {"id":"d","emoji":"🍽️","text_ar":"سوء الأكل","text_en":"Bad food","trait_weights":{}}]'),

('11111111-1111-1111-1111-111111111111', 1, 'self', 'fame', 'funny',
 'لو صرت مشهور بسبب…', 'I''d go viral for…', 1,
 '[{"id":"a","emoji":"😂","text_ar":"موقف مضحك","text_en":"A funny moment","trait_weights":{"humor":0.7}},
   {"id":"b","emoji":"🕺","text_ar":"رقصة","text_en":"A dance","trait_weights":{"confidence":0.6}},
   {"id":"c","emoji":"🍳","text_ar":"طبخة غريبة","text_en":"Weird cooking","trait_weights":{"creativity":0.5}},
   {"id":"d","emoji":"🗯️","text_ar":"تغريدة","text_en":"A tweet","trait_weights":{"creativity":0.4}}]');

-- ----------------------------------------------------------------------------
-- ROUND 2 — FRIEND VOTE  (category powers both awards and compatibility signal)
-- ----------------------------------------------------------------------------
insert into questions (pack_id, round, question_type, category, difficulty, text_ar, text_en, weight, options) values
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'become_rich', 'mixed', 'يصير غني', 'Become rich', 1, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'become_famous', 'funny', 'يصير مشهور', 'Become famous', 1, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'sleep_anywhere', 'funny', 'ينام بأي مكان', 'Sleep anywhere', 0.8, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'forget_passport', 'funny', 'ينسى جوازه', 'Forget their passport', 0.8, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'cancel_plans', 'chaotic', 'يلغي الخطط بآخر لحظة', 'Cancel plans last-minute', 1, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'be_late', 'chaotic', 'يتأخر عن كل شيء', 'Be late to everything', 1, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'reply_instantly', 'mixed', 'يرد فورًا على الرسائل', 'Reply instantly', 0.8, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'ignore_messages', 'mixed', 'يتجاهل الرسائل', 'Ignore messages', 0.8, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'own_lambo', 'funny', 'يمتلك لمبرغيني', 'Own a Lamborghini', 0.6, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'open_businesses', 'mixed', 'يفتح خمس مشاريع', 'Open five businesses', 1, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'travel_monthly', 'mixed', 'يسافر كل شهر', 'Travel every month', 0.8, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'cry_first', 'deep', 'يبچي أول واحد', 'Cry first', 0.6, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'marry_first', 'deep', 'يتزوج أول واحد', 'Get married first', 0.8, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'become_ceo', 'mixed', 'يصير مدير تنفيذي', 'Become a CEO', 1, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'get_lost', 'funny', 'يضيع بأي مكان', 'Get lost', 0.6, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'become_influencer', 'funny', 'يصير مؤثر سوشيال ميديا', 'Become an influencer', 0.8, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'win_survivor', 'chaotic', 'يفوز ببرنامج بقاء', 'Win a Survivor-style show', 0.6, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'start_drama', 'chaotic', 'يبدأ دراما', 'Start drama', 1, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'fix_drama', 'mixed', 'يحل الدراما', 'Fix drama', 1, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'keep_secrets', 'deep', 'يحفظ الأسرار', 'Keep secrets', 0.8, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'spend_too_much', 'mixed', 'يصرف بدون حساب', 'Spend too much', 0.8, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'become_millionaire', 'mixed', 'يصير مليونير', 'Become a millionaire', 1, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'go_viral_accidentally', 'funny', 'يصير فيروسي بالغلط', 'Accidentally go viral', 0.8, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'own_seven_cats', 'funny', 'يمتلك سبع قطط', 'Own seven cats', 0.5, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'always_order_dessert', 'funny', 'يطلب حلا دايمًا', 'Always order dessert', 0.5, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'fall_asleep_first', 'funny', 'ينام أول واحد بأي تجمع', 'Fall asleep first at any hangout', 0.5, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'win_debate', 'mixed', 'يفوز بأي نقاش', 'Win any debate', 0.8, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'lose_keys', 'funny', 'يضيع مفاتيحه', 'Lose their keys', 0.5, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'forget_birthdays', 'funny', 'ينسى أعياد الميلاد', 'Forget birthdays', 0.5, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'always_pay_bill', 'mixed', 'يدفع الفاتورة دايمًا', 'Always pay the bill', 0.8, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'best_fashion', 'mixed', 'أحلى ستايل', 'Have the best fashion', 0.6, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'become_pilot', 'mixed', 'يصير طيار', 'Become a pilot', 0.6, '[]'),
('11111111-1111-1111-1111-111111111111', 2, 'friend_vote', 'live_abroad', 'mixed', 'يعيش برة البلد', 'Live abroad', 0.8, '[]');

-- ----------------------------------------------------------------------------
-- ROUND 3 — BONUS  (guess_percentage mini game; the "actual" number is a
-- config value here, but in production compute it live from Round 2 votes
-- for the matching category — see BUILD_BRIEF.md)
-- ----------------------------------------------------------------------------
insert into questions (pack_id, round, question_type, category, difficulty, text_ar, text_en, weight, options) values
('11111111-1111-1111-1111-111111111111', 3, 'guess_percentage', 'zombie_survival', 'funny',
 'كم ٪ من القروب بيصمدون بنهاية العالم الزومبي؟', 'What % of the group would survive a zombie apocalypse?', 1, '[]'),
('11111111-1111-1111-1111-111111111111', 3, 'guess_percentage', 'lost_wallet', 'funny',
 'كم ٪ نسوا محفظتهم أكثر من مرة؟', 'What % have forgotten their wallet more than once?', 1, '[]'),
('11111111-1111-1111-1111-111111111111', 3, 'guess_percentage', 'believe_millionaire', 'mixed',
 'كم ٪ متأكدين إنهم بيصيرون مليونيرات؟', 'What % are sure they''ll become millionaires?', 1, '[]');

-- ----------------------------------------------------------------------------
-- SCORE FORMULAS  (configurable — edit weights any time from the admin panel)
-- ----------------------------------------------------------------------------
insert into score_formulas (trait_key, name_ar, name_en, components) values
('leadership', 'القيادة', 'Leadership',
 '[{"source":"peer_votes","weight":0.4,"category":"become_ceo"},
   {"source":"self_answers","weight":0.4,"category":"identity"},
   {"source":"behavioral","weight":0.2,"category":"crisis"}]'),
('humor', 'الفكاهة', 'Humor',
 '[{"source":"self_answers","weight":0.6,"category":"temperament"},
   {"source":"peer_votes","weight":0.4,"category":"start_drama"}]'),
('energy', 'الطاقة', 'Energy',
 '[{"source":"self_answers","weight":0.7,"category":"temperament"},
   {"source":"behavioral","weight":0.3,"category":"travel_style"}]'),
('loyalty', 'الوفاء', 'Loyalty',
 '[{"source":"self_answers","weight":0.5,"category":"pet_peeve"},
   {"source":"peer_votes","weight":0.5,"category":"keep_secrets"}]'),
('adventure', 'المغامرة', 'Adventure',
 '[{"source":"self_answers","weight":0.6,"category":"travel_style"},
   {"source":"peer_votes","weight":0.4,"category":"travel_monthly"}]'),
('kindness', 'اللطف', 'Kindness',
 '[{"source":"self_answers","weight":0.5,"category":"pet_peeve"},
   {"source":"peer_votes","weight":0.5,"category":"fix_drama"}]'),
('creativity', 'الإبداع', 'Creativity',
 '[{"source":"self_answers","weight":0.7,"category":"fame"},
   {"source":"peer_votes","weight":0.3,"category":"become_influencer"}]'),
('organization', 'التنظيم', 'Organization',
 '[{"source":"self_answers","weight":0.6,"category":"travel_style"},
   {"source":"peer_votes","weight":0.4,"category":"be_late"}]'),
('confidence', 'الثقة', 'Confidence',
 '[{"source":"self_answers","weight":0.6,"category":"crisis"},
   {"source":"peer_votes","weight":0.4,"category":"win_debate"}]'),
('responsibility', 'المسؤولية', 'Responsibility',
 '[{"source":"self_answers","weight":0.5,"category":"money"},
   {"source":"peer_votes","weight":0.5,"category":"always_pay_bill"}]');

-- ----------------------------------------------------------------------------
-- AWARDS  (rule drives automatic assignment — see BUILD_BRIEF.md scoring section)
-- ----------------------------------------------------------------------------
insert into awards (slug, emoji, name_ar, name_en, description_ar, description_en, rule, sort_order) values
('ceo', '👑', 'الرئيس التنفيذي', 'The CEO', 'أعلى نتيجة قيادة بالقروب', 'Highest leadership score in the group',
 '{"type":"top_trait","trait_key":"leadership"}', 1),
('chaos_generator', '😂', 'صانع الفوضى', 'Chaos Generator', 'الأكثر تصويتًا لبدء الدراما', 'Most votes for starting drama',
 '{"type":"top_vote_category","category":"start_drama"}', 2),
('walking_wikipedia', '🧠', 'ويكيبيديا الماشية', 'Walking Wikipedia', 'أعلى نتيجة مسؤولية ومنطق', 'Highest responsibility score',
 '{"type":"top_trait","trait_key":"responsibility"}', 3),
('foodie', '🍕', 'عاشق الأكل', 'Professional Foodie', 'أكثر واحد اختار خيارات الأكل', 'Picked food-related options most often',
 '{"type":"top_self_category","category":"spending","option_id":"b"}', 4),
('always_late', '🚗', 'دايم متأخر', 'Always Late', 'الأكثر تصويتًا للتأخير', 'Most votes for being late',
 '{"type":"top_vote_category","category":"be_late"}', 5),
('future_billionaire', '💰', 'مليونير المستقبل', 'Future Billionaire', 'الأكثر تصويتًا ليصير مليونير', 'Most votes to become a millionaire',
 '{"type":"top_vote_category","category":"become_millionaire"}', 6),
('ghost', '👻', 'يشبح القروب', 'Ghosts the Group Chat', 'الأكثر تصويتًا لتجاهل الرسائل', 'Most votes for ignoring messages',
 '{"type":"top_vote_category","category":"ignore_messages"}', 7),
('main_character', '📸', 'الشخصية الرئيسية', 'Main Character', 'الأكثر تصويتًا ليصير مشهور', 'Most votes for becoming famous',
 '{"type":"top_vote_category","category":"become_famous"}', 8),
('therapist', '❤️', 'المعالج النفسي', 'The Therapist', 'الأكثر تصويتًا لحل الدراما', 'Most votes for fixing drama',
 '{"type":"top_vote_category","category":"fix_drama"}', 9),
('gym_hero', '🏋️', 'بطل الجيم', 'Gym Hero', 'أعلى نتيجة طاقة', 'Highest energy score',
 '{"type":"top_trait","trait_key":"energy"}', 10),
('coffee_addict', '☕', 'مدمن قهوة', 'Coffee Addict', 'اختار القهوة بأكثر سؤال', 'Picked coffee most often in Round 1',
 '{"type":"top_self_category","category":"spending","option_id":"a"}', 11),
('adventurer', '🌎', 'المغامر', 'Adventurer', 'أعلى نتيجة مغامرة', 'Highest adventure score',
 '{"type":"top_trait","trait_key":"adventure"}', 12),
('most_reliable', '🎯', 'الأكثر موثوقية', 'Most Reliable', 'أعلى نتيجة مسؤولية ووفاء', 'Highest combined responsibility & loyalty',
 '{"type":"top_trait_combo","trait_keys":["responsibility","loyalty"]}', 13);

-- ----------------------------------------------------------------------------
-- RESULT TEMPLATES  (Results Engine — mixed together for unique summaries)
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
('summary_trait', '[{"trait":"loyalty","op":">","value":80}]',
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

('hidden_stat', '[{"vote_category":"become_famous","op":">","value":70}]',
 '{percent}% احتمال تصير مشهور بالغلط قدام القروب',
 '{percent}% chance you go accidentally viral in front of the group', 1),
('hidden_stat', '[{"vote_category":"be_late","op":">","value":60}]',
 '{percent}% من الأصحاب متفقين إنك دايم متأخر',
 '{percent}% of friends agree you''re always late', 1),
('hidden_stat', '[{"vote_category":"become_millionaire","op":">","value":50}]',
 '{percent}% متأكدين إنك بتصير مليونير',
 '{percent}% are sure you''ll become a millionaire', 1);

-- ----------------------------------------------------------------------------
-- DEFAULT SETTINGS
-- ----------------------------------------------------------------------------
insert into settings (key, value) values
('default_pack', '"friends"'),
('min_players_to_start', '2'),
('max_players_default', '8'),
('rounds_enabled', '[1,2,3]'),
('safety_no_appearance_awards', 'true'),
('safety_no_political_religious_questions', 'true');
