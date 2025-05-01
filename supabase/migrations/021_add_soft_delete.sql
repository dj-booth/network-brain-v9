-- Add soft delete column to people table
ALTER TABLE people
ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;

-- Add index for faster filtering of non-deleted records
CREATE INDEX IF NOT EXISTS idx_people_deleted ON people(deleted);

-- Add comment
COMMENT ON COLUMN people.deleted IS 'Soft delete flag - true means the profile is hidden but data is preserved'; 