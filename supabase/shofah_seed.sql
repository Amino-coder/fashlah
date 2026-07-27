-- ============================================================================
-- SHOFAH — question bank seed v2 (27 prompts: 19 universal + 2 guy-only +
-- 6 girl-only). Arabic wording written fresh in playful Saudi dialect.
-- `audience` null = universal, 'girl'/'guy' = only drawn for that character.
-- ============================================================================

-- Universal (19)
insert into shofah_prompts (category, text_ar, text_en, audience) values
('opening', 'عرّف عن نفسك بثلاث كلمات بس.', 'Introduce yourself in exactly three words.', null),
('opening', 'اوصف نفسك كأنك تسوي دعاية لسيارة تبي تبيعها.', 'Describe yourself like you''re selling a used car.', null),
('getting_to_know_you', 'قول لي شي جذاب عن نفسك محد يتفق معاك عليه.', 'Tell me something attractive about yourself that nobody else agrees with.', null),
('getting_to_know_you', 'وش أكبر ريد فلاق فيك؟', 'What''s your biggest red flag?', null),
('career_money', 'وش الوصف اللي ينفع أنا ومديرك نقوله عنك؟ 😉', 'What''s a description both me and your boss would agree on? 😉', null),
('career_money', 'لو بحثت عن اسمك في قوقل، وش بلقى؟', 'If I Googled your name, what would I find?', null),
('wildcard', 'وش بنسوي لو كنا لحالنا؟ (بأدب 🏃🏻‍♂️)', 'What would we do if we were alone? (keep it PG 🏃🏻‍♂️)', null),
('lifestyle', 'لو غرفتك تتكلم، وش بتقول عنك؟', 'If your room could talk, what would it say about you?', null),
('awkward', 'ليش فشلت علاقتك اللي راحت؟ (قول شي حتى لو ما عندك جواب.)', 'Why did your last relationship end? (Make something up if you have to.)', null),
('marriage', 'اقنع أهلي بجملة وحدة.', 'Convince my family in one sentence.', null),
('marriage', 'وش بيكون أغبى سبب يخلينا نتهاوش؟', 'What''s the dumbest thing we''ll end up fighting about?', null),
('marriage', 'ليش عيالك بالمستقبل بيحسبونك رهيب؟', 'Why will your future kids think you''re the coolest?', null),
('marriage', 'وش أول شي بتشتريه بعد ما نتزوج؟ (بنادول إكسترا؟)', 'What''s the first thing you''ll buy after we get married? (Extra-strength painkillers, maybe?)', null),
('wildcard', 'قول غزل سخيف لدرجة بضحك من سخافته.', 'Give me a pickup line so bad it''s actually funny.', null),
('wildcard', 'قول شي يخليني أرفضك على طول.', 'Say something that''ll make me reject you instantly.', null),
('wildcard', 'غازلني بدون لا تستخدم حرف الألف "ا".', 'Flirt with me without using the letter "A".', null),
('wildcard', 'وين بيكون أول ديت لنا؟ (أجوبة خاطئة فقط)', 'Where''s our first date happening? (wrong answers only)', null),
('awkward', 'وش الشي الغريب اللي "اكيييد 😉" ما تسويه؟', 'What''s the weird thing you "definitely 😉" don''t do?', null),
('getting_to_know_you', 'وش الشي اللي يخليني ما أنساك أبداً؟', 'What''s the one thing that''ll make me never forget you?', null);

-- مرعي (guy) only — 2 scenarios
insert into shofah_prompts (category, text_ar, text_en, audience) values
('wildcard', 'عنده بقدونس بين أسنانه، وش بتسوي؟', 'He''s got parsley stuck in his teeth — what do you do?', 'guy'),
('wildcard', 'قال لك إنه بردان، وش بتسوي؟', 'He tells you he''s freezing — what do you do?', 'guy');

-- مزنة (girl) only — 6 scenarios
insert into shofah_prompts (category, text_ar, text_en, audience) values
('wildcard', 'عندها بقدونس بين أسنانها، وش بتسوي؟', 'She''s got parsley stuck in her teeth — what do you do?', 'girl'),
('wildcard', 'قالت لك إنها بردانة، وش بتسوي؟', 'She tells you she''s freezing — what do you do?', 'girl'),
('wildcard', 'باروكتها مالت، وش بتقول بدون ما تزعل؟', 'Her wig slipped sideways — what do you say without hurting her feelings?', 'girl'),
('wildcard', 'رجلها تعورها، وش بتسوي؟', 'Her leg''s been hurting her — what do you do?', 'girl'),
('wildcard', 'أوبس! كبيت عليك العصير، وش بتقول؟', 'Oops — I just spilled juice on you. What do you say?', 'girl'),
('wildcard', 'رمشها طاح على الطاولة، وش بتسوي؟', 'Her eyelash fell out onto the table — what do you do?', 'girl');
