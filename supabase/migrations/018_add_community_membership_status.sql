-- Create community_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS community_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    -- Add unique constraint to prevent duplicates
    CONSTRAINT unique_community_person UNIQUE (community_id, person_id)
);

-- Add indexes for foreign keys if they don't exist
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_person_id ON community_members(person_id);

-- Add trigger for updated_at if it doesn't exist
-- Ensure the function exists first (it should from init.sql)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_community_members_updated_at'
  ) THEN
    CREATE TRIGGER update_community_members_updated_at
      BEFORE UPDATE ON community_members
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;


-- Create the ENUM type for community membership status
-- Use DO block to avoid error if type already exists (e.g., from partial run)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'community_membership_status'
  ) THEN
    CREATE TYPE community_membership_status AS ENUM (
      'prospect',
      'applied',
      'nominated',
      'approved',
      'inactive'
    );
  END IF;
END $$;

-- Add the membership_status column to the community_members table if it doesn't exist
ALTER TABLE community_members
ADD COLUMN IF NOT EXISTS membership_status community_membership_status;

-- Add index on the new status column if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_community_members_status ON community_members(membership_status); 