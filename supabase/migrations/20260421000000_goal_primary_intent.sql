-- Add primary_intent to throughline_goals
-- Aligns Niyyah (intention) at goal inception: immediate Dunya or legacy Akhirah.
ALTER TABLE throughline_goals
  ADD COLUMN IF NOT EXISTS primary_intent text
  CHECK (primary_intent IN ('immediate', 'legacy'));
