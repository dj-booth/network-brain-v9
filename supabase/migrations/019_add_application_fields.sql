-- Add basic profile fields to people table if they don't exist
ALTER TABLE people
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '/placeholder-avatar.svg',
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS company TEXT;

-- Add professional background and summary fields
ALTER TABLE people
ADD COLUMN IF NOT EXISTS current_focus TEXT,
ADD COLUMN IF NOT EXISTS startup_experience TEXT,
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS detailed_summary TEXT;

-- Add array fields for skills and interests
ALTER TABLE people
ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';

-- Add application specific fields
ALTER TABLE people
ADD COLUMN IF NOT EXISTS last_startup_role TEXT,
ADD COLUMN IF NOT EXISTS preferred_role TEXT,
ADD COLUMN IF NOT EXISTS preferred_company_stage TEXT,
ADD COLUMN IF NOT EXISTS long_term_goal TEXT,
ADD COLUMN IF NOT EXISTS application_date TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS application_metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS referral_source TEXT,
ADD COLUMN IF NOT EXISTS internal_notes TEXT,
ADD COLUMN IF NOT EXISTS last_contact DATE;

-- Create indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_people_location ON people(location);
CREATE INDEX IF NOT EXISTS idx_people_application_date ON people(application_date);
CREATE INDEX IF NOT EXISTS idx_people_company ON people(company);
CREATE INDEX IF NOT EXISTS idx_people_title ON people(title);
CREATE INDEX IF NOT EXISTS idx_people_last_contact ON people(last_contact);

-- Add GIN indexes for array and full-text search fields
CREATE INDEX IF NOT EXISTS idx_people_skills ON people USING GIN (skills);
CREATE INDEX IF NOT EXISTS idx_people_interests ON people USING GIN (interests);
CREATE INDEX IF NOT EXISTS idx_people_summary_fts ON people USING GIN (to_tsvector('english', COALESCE(summary, '')));

-- Add table and column comments
COMMENT ON TABLE people IS 'Contains user profiles and application data for community members';
COMMENT ON COLUMN people.linkedin_url IS 'LinkedIn profile URL';
COMMENT ON COLUMN people.current_focus IS 'Current professional focus or project';
COMMENT ON COLUMN people.startup_experience IS 'Description of previous startup experience';
COMMENT ON COLUMN people.skills IS 'Array of professional skills';
COMMENT ON COLUMN people.interests IS 'Array of professional interests and focus areas';
COMMENT ON COLUMN people.last_startup_role IS 'Most recent role in a startup';
COMMENT ON COLUMN people.preferred_role IS 'Desired role or position';
COMMENT ON COLUMN people.preferred_company_stage IS 'Preferred company stage (e.g., pre-seed, seed, etc.)';
COMMENT ON COLUMN people.long_term_goal IS 'Long-term career or professional goals';
COMMENT ON COLUMN people.application_metadata IS 'Additional flexible application data stored as JSONB';
COMMENT ON COLUMN people.internal_notes IS 'Private notes about the application/applicant';
COMMENT ON COLUMN people.referral_source IS 'How the applicant heard about or was referred to the community';
COMMENT ON COLUMN people.last_contact IS 'Date of most recent contact or interaction'; 