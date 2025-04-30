-- Add last_generated_at column to people table
ALTER TABLE people
ADD COLUMN IF NOT EXISTS last_generated_at TIMESTAMPTZ;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_people_last_generated_at ON people(last_generated_at);

-- Add comment
COMMENT ON COLUMN people.last_generated_at IS 'Timestamp of when the profile was last generated using AI'; 