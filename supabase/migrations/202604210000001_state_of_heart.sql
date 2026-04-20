-- Add state_of_heart to throughline_entries
-- Tracks the Nafs/heart state at the moment of capture.
ALTER TABLE throughline_entries
  ADD COLUMN IF NOT EXISTS state_of_heart text
  CHECK (state_of_heart IN ('open', 'clear', 'clouded', 'contracted'));
