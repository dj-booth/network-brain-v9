-- First, create temporary columns to hold the data during conversion
ALTER TABLE people
ADD COLUMN intros_sought_text TEXT,
ADD COLUMN reasons_to_introduce_text TEXT;

-- Drop the existing columns
ALTER TABLE people
DROP COLUMN IF EXISTS intros_sought,
DROP COLUMN IF EXISTS reasons_to_introduce;

-- Rename the new columns to the original names
ALTER TABLE people
RENAME COLUMN intros_sought_text TO intros_sought;

ALTER TABLE people
RENAME COLUMN reasons_to_introduce_text TO reasons_to_introduce; 