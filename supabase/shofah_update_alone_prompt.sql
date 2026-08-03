-- ============================================================================
-- شوفة — replace the universal "وش بنسوي لو كنا لحالنا؟" prompt with a new
-- girl-specific one about her younger brother spilling coffee.
--
-- Safe to run against a live database: this is a single targeted UPDATE
-- by exact text match, not a re-seed. It doesn't touch any other prompt,
-- doesn't delete or recreate rows, and doesn't disturb any existing
-- shofah_round_prompts / shofah_answers that reference this prompt's id
-- from past or in-progress games — the row keeps its id, only its
-- content and audience change.
-- ============================================================================

update shofah_prompts
set
  text_ar = 'اخوها الصغير دخل وكب عليك القهوة- وش بتسوي! 👼',
  text_en = 'Her younger brother spilled the coffee all over you - what will you do',
  audience = 'girl'
where text_ar = 'وش بنسوي لو كنا لحالنا؟ (بأدب 🏃🏻‍♂️)';

-- Sanity check — should return exactly one row confirming it landed.
select id, category, text_ar, text_en, audience
from shofah_prompts
where text_ar = 'اخوها الصغير دخل وكب عليك القهوة- وش بتسوي! 👼';
