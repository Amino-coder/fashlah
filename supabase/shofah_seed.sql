-- ============================================================================
-- SHOFAH — question bank seed (49 prompts across 7 categories)
-- Arabic wording is written fresh in playful Saudi dialect, not translated
-- literally, so the jokes actually land the way they do in Fashlah.
-- ============================================================================

insert into shofah_prompts (category, text_ar, text_en) values
-- Opening
('opening', 'بهرني بالضبط بست كلمات.', 'Impress me in exactly 6 words.'),
('opening', 'قول أحلى جملة افتتاحية عندك.', 'Give me your best opening line.'),
('opening', 'عرّف عن نفسك بثلاث كلمات بس.', 'Introduce yourself using only three words.'),
('opening', 'لو حياتك فلم، وش يكون اسمه؟', 'If your life had a movie title, what would it be?'),
('opening', 'ضحكني بجملة وحدة.', 'Make me laugh in one sentence.'),
('opening', 'وصف نفسك مثل ما تسوي دعاية لسيارة مستعملة تبي تبيعها.', "Describe yourself like you're selling a used car."),

-- Getting to know you
('getting_to_know_you', 'غازلني بدون لا تذكر شكلي.', 'Flirt without mentioning appearance.'),
('getting_to_know_you', 'قول لي شي مثير عن نفسك.', 'Tell me something interesting about yourself.'),
('getting_to_know_you', 'وش أغرب موهبة عندك؟', "What's your weirdest talent?"),
('getting_to_know_you', 'وش أكثر شي إيجابي فيك؟', "What's the greenest flag about you?"),
('getting_to_know_you', 'وش أكبر مؤشر خطر فيك؟', "What's your biggest red flag?"),
('getting_to_know_you', 'وش أكبر شي تحس فيه بعدم الثقة؟', "What's your biggest insecurity?"),
('getting_to_know_you', 'وش الشي اللي أهلك يحذرون الناس منه؟', "What's one thing your family warns people about?"),
('getting_to_know_you', 'وش أكثر شي طفولي لسا تسويه؟', "What's the most childish thing you still do?"),
('getting_to_know_you', 'وش صفتك السامة... كن صادق.', "What's your toxic trait... be honest."),

-- Career & Money
('career_money', 'اشرح شغلك بأسوأ طريقة ممكنة.', 'Explain your job in the worst possible way.'),
('career_money', 'كيف يوصفك مديرك؟', 'How would your boss describe you?'),
('career_money', 'ليش لين الحين ما طردوك؟', "Why haven't you been fired yet?"),
('career_money', 'لو بحثت باسمك في قوقل، وش بلقى؟', 'If I Googled your name, what would I find?'),
('career_money', 'وش أسرع طريقة تصير فيها غني؟', "What's the fastest way you could become rich?"),
('career_money', 'اقنعني إن شغلك مو مؤشر خطر.', "Convince me your career isn't a red flag."),

-- Lifestyle
('lifestyle', 'وصف ليلة الجمعة المثالية عندك.', 'Describe your ideal Friday night.'),
('lifestyle', 'وش أغلى عادة سيئة عندك؟', "What's your most expensive bad habit?"),
('lifestyle', 'لو سافرنا باكر، بنروح وين؟', "If we went on vacation tomorrow, where are we going?"),
('lifestyle', 'وش الأكلة اللي مستحيل تاكلها؟', "What's something you absolutely refuse to eat?"),
('lifestyle', 'لو غرفتك تتكلم، وش بتقول عنك؟', "What would your room say about you?"),

-- Awkward
('awkward', 'وش أغبى شي سويته بحياتك؟', "What's the dumbest thing you've ever done?"),
('awkward', 'وش أغرب كذبة قلتها؟', "What's the strangest lie you've told?"),
('awkward', 'وش أكثر موقف محرج صار لك؟', "What's your most embarrassing moment?"),
('awkward', 'وش الشي اللي تتمنى ما أكتشفه أبد؟', "What's one thing you hope I never find out?"),
('awkward', 'ليش فشلت علاقتك اللي طافت؟ (اختلق شي لو ما عندك جواب.)', "Why did your last relationship fail? (Make something up if needed.)"),

-- Marriage
('marriage', 'ليش لازم أتزوجك؟', 'Why should I marry you?'),
('marriage', 'اقنع أهلي بجملة وحدة.', 'Convince my parents in one sentence.'),
('marriage', 'كمل الجملة: "الحياة وياي بتكون..."', 'Finish this sentence: "Life with me will be..."'),
('marriage', 'وش بيكون أول خلاف بينا؟', "What's our first argument going to be about?"),
('marriage', 'وين بنروح شهر العسل؟', 'Where are we going for our honeymoon?'),
('marriage', 'وش الوعد اللي بتوفي فيه فعلاً؟', "What's one promise you'd actually keep?"),
('marriage', 'ليش عيالك بالمستقبل بيحسبونك رهيب؟', "Why would your future kids think you're cool?"),
('marriage', 'وش أول شي بتشتريه بعد ما نتزوج؟', "What's the first thing you'd buy after we got married?"),

-- Wildcards
('wildcard', 'جاوب بس بالإيموجي.', 'Reply using only emojis.'),
('wildcard', 'قول جملة تعارف سيئة جداً لدرجة تصير حلوة.', 'Use a pickup line so bad it becomes good.'),
('wildcard', 'خليني أرفضك على طول.', 'Make me reject you immediately.'),
('wildcard', 'ابعث رسالة "بالغلط" لشخص ثاني.', 'Accidentally send the wrong message.'),
('wildcard', 'بهرني وأنت واضح إنك تكذب.', 'Impress me while clearly lying.'),
('wildcard', 'ضحكني بدون لا تستخدم حرف الألف "ا".', 'Make me laugh without using the letter "A" / "ا".'),
('wildcard', 'اكتب أكثر رسالة درامية ممكنة.', 'Write the most dramatic message possible.'),
('wildcard', 'اقنعني إنك مو مريب أبد.', "Convince me you're definitely not suspicious."),
('wildcard', 'اعتذر عن شي أكيد ما سويته.', "Apologize for something you definitely didn't do."),
('wildcard', 'اكتب أحرج مقطع صوتي ممكن ترسله... بس بالنص.', 'Send the most awkward voice note... in text.');
