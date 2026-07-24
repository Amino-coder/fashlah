-- Run after migration_006. Replaces score_formulas and awards (both were
-- written against question categories that no longer exist after the
-- Round 1/2 content refresh), and refreshes hidden_stat templates the same
-- way. summary_opener/summary_trait/summary_closer templates are untouched
-- — they key off trait names (energy, leadership, humor, ...), which are
-- unchanged.

delete from award_results;  -- no real data yet (scoring engine hasn't run), safe to clear
delete from scores;
delete from awards;
delete from score_formulas;
delete from result_templates where template_type = 'hidden_stat';

-- --------------------------------------------------------------------------
-- SCORE FORMULAS — one trait each, purely from Round 1 trait_weights.
-- No category filter: with only 10-of-35 Round 1 questions shown per
-- session, category-scoped formulas would too often have zero data. Traits
-- are already spread across the whole question bank via trait_weights, so
-- the scoring engine averages every trait_weight[trait_key] found across
-- whichever 10 questions this session drew.
-- --------------------------------------------------------------------------
insert into score_formulas (trait_key, name_ar, name_en, components) values
('leadership', 'القيادة', 'Leadership', '[{"source":"self_answers","weight":1}]'),
('humor', 'الفكاهة', 'Humor', '[{"source":"self_answers","weight":1}]'),
('energy', 'الطاقة', 'Energy', '[{"source":"self_answers","weight":1}]'),
('organization', 'مهارة التنظيم', 'Organization', '[{"source":"self_answers","weight":1}]'),
('adventure', 'المغامرة', 'Adventure', '[{"source":"self_answers","weight":1}]'),
('kindness', 'اللطافة', 'Kindness', '[{"source":"self_answers","weight":1}]'),
('confidence', 'الثقة', 'Confidence', '[{"source":"self_answers","weight":1}]'),
('responsibility', 'المسؤولية', 'Responsibility', '[{"source":"self_answers","weight":1}]');

-- --------------------------------------------------------------------------
-- AWARDS — mix of trait-based (always computable) and vote-based (tied to
-- real Round 2 categories; simply won't trigger in a session if that
-- specific prompt wasn't in the random 13, which is fine).
-- --------------------------------------------------------------------------
insert into awards (slug, emoji, name_ar, name_en, description_ar, description_en, rule, sort_order) values
('ceo', '👑', 'الرئيس التنفيذي', 'The CEO', 'أعلى نتيجة قيادة بالقروب', 'Highest leadership score in the group',
 '{"type":"top_trait","trait_key":"leadership"}', 1),
('chaos_generator', '😂', 'صانع الفوضى', 'Chaos Generator', 'الأكثر تصويتًا لبدء الدراما', 'Most votes for starting group-chat drama',
 '{"type":"top_vote_category","category":"start_drama_gc"}', 2),
('walking_wikipedia', '🧠', 'ويكيبيديا', 'Walking Wikipedia', 'أعلى نتيجة مسؤولية', 'Highest responsibility score',
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

-- --------------------------------------------------------------------------
-- HIDDEN STAT TEMPLATES — refreshed to real Round 2 categories.
-- --------------------------------------------------------------------------
insert into result_templates (template_type, conditions, text_ar, text_en, weight) values
('hidden_stat', '[{"vote_category":"survive_zombie","op":">","value":50}]',
 '{percent}% احتمال تصمد بنهاية العالم الزومبي', '{percent}% chance you''d survive a zombie apocalypse', 1),
('hidden_stat', '[{"vote_category":"become_millionaire","op":">","value":30}]',
 '{percent}% متأكدين إنك بتصير مليونير', '{percent}% are sure you''ll become a millionaire', 1),
('hidden_stat', '[{"vote_category":"famous_random","op":">","value":30}]',
 '{percent}% احتمال تشتهر بشي غريب', '{percent}% chance you go randomly famous', 1);
