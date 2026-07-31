-- ============================================================================
-- JOB INTERVIEW — replace the question banks (revised set)
-- ============================================================================
-- Run this ONLY if you already ran job_schema.sql and want the updated
-- questions. For a fresh database, job_schema.sql already contains them and
-- this file is unnecessary.
--
-- job_round_prompts.prompt_id has a foreign key onto job_prompts with no
-- cascade, so the old prompts can't be deleted while any session still
-- references them. Existing game data is therefore cleared first.
--
-- NOTE: this wipes all sessions, players, answers and votes — the same
-- effect as job_reset_test_data.sql. Intended for pre-launch use.
-- ============================================================================

begin;

-- 1. Clear game data that references the prompt banks
delete from job_round_results;
delete from job_votes;
delete from job_answers;
delete from job_round_prompts;
delete from job_prewarm_votes;
delete from job_prewarm_round_prompts;
delete from job_players;
delete from job_sessions;

-- 2. Empty the banks
delete from job_prompts;
delete from job_prewarm_prompts;

-- 3. Reseed — interview questions
insert into job_prompts (category, text_ar, text_en) values
  ('opening', 'سوّق لنفسك كأنك سيارة مستعملة. 🛻', 'Sell yourself like you''re a used car. 🛻'),
  ('experience', 'ليش انطردت من شغلك اللي راح؟ 🚨', 'Why did you get fired from your last job? 🚨'),
  ('weakness', 'وش أكبر نقطة ضعف فيك؟ (قولها بطريقة تخليها شي إيجابي 🏃🏻‍♂️)', 'What''s your biggest weakness? (Spin it into a strength 🏃🏻‍♂️)'),
  ('weakness', 'وش العادة الخايسة اللي بتخليك تنطرد من اول اسبوع؟', 'What''s the bad habit that''ll get you fired in your first week?'),
  ('weakness', 'وش بيقول عنك مديرك السابق لو اتصلنا فيه؟ 💀', 'What would your last boss say if we called them? 💀'),
  ('salary', 'اذا نقدر نعطيك شي ثاني بدل الراتب وش بتاخذ؟', 'If we could pay you in something other than money, what would you take?'),
  ('salary', 'اقنعني تستاهل زيادة براتبك وانت باقي ما بديت.', 'Convince me you deserve a raise before you''ve even started.'),
  ('salary', 'وش أغبى شي بتشتريه من أول راتب؟', 'What''s the dumbest thing you''ll buy with your first paycheck?'),
  ('awkward', 'لو شفت مديرك يبوووق الشركة وش بتسوي؟', 'You catch your boss stealing from the company. What do you do?'),
  ('awkward', 'المدير طلب منك تشتغل الويكند، وش بتقول؟', 'Your boss asks you to work the weekend. What do you say?'),
  ('awkward', 'وصلت متأخر ساعتين… عطنا عذر يستحق جائزة أوسكار', 'You''re two hours late... give us an Oscar-worthy excuse.'),
  ('awkward', 'وش الشي اللي يقوله لك مديرك وينفع تقوله لزوجك/زوجتك بنفس الوقت؟', 'What''s something your boss says that would also work said to your spouse?'),
  ('awkward', 'لو مديرك ناداك لحالك بمكتبه وش بيكون السبب؟', 'If your boss called you into his office alone, what would the reason be?'),
  ('teamwork', 'واحد اخذ الكريدت على شغلك، كيف بتنتقم؟ 🪓', 'Someone took credit for your work. How do you get revenge? 🪓'),
  ('teamwork', 'وش بتسوي عشان تسرق وظيفة مديرك؟', 'What would you do to steal your boss''s job?'),
  ('teamwork', 'وش تتوقع يقولون عنك زملائك من ورا ضهرك؟', 'What do you think your coworkers say about you behind your back?'),
  ('wildcard', 'وين تشوف نفسك بعد ٥ سنين؟ (أجوبة خاطئة فقط)', 'Where do you see yourself in 5 years? (wrong answers only)'),
  ('wildcard', 'عندك اي سؤال لي؟ (اي سؤال حتى لو شاطح 😅)', 'Do you have a question for me? (Any question, even a wild one 😅)'),
  ('wildcard', 'الشركة صارت لك ليوم واحد — وش أول قرار؟', 'The company is yours for one day — what''s your first decision?');

-- 4. Reseed — warm-up round
insert into job_prewarm_prompts (text_ar, text_en) values
  ('مين أول واحد بينطرد من الشغل', 'Who gets fired first'),
  ('مين بيتأخر عن الدوام كل يوم', 'Who''s late every single day'),
  ('مين بيصير مدير خلال سنة', 'Who becomes the boss within a year'),
  ('مين بينام في كل اجتماع', 'Who falls asleep in every meeting'),
  ('مين بياخذ الكريدت على شغل غيره', 'Who takes credit for someone else''s work'),
  ('مين يرد على الإيميلات الساعة ٣ الفجر', 'Who replies to emails at 3 AM'),
  ('مين بيستقيل من أول أسبوع', 'Who quits in the first week'),
  ('مين بيشتغل من البيت وما يفتح اللابتوب', 'Who works from home and never opens the laptop');

commit;

-- Sanity check (both must be >= 5, since 5 of each are drawn per session)
select 'job_prompts' as bank, count(*) from job_prompts
union all
select 'job_prewarm_prompts', count(*) from job_prewarm_prompts;
