-- Create enum for system prompt types
CREATE TYPE system_prompt_type AS ENUM (
  'profile_generation',
  'new_person_research'
);

-- Add new columns to system_prompts table
ALTER TABLE system_prompts
ADD COLUMN IF NOT EXISTS type system_prompt_type NOT NULL DEFAULT 'profile_generation',
ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS key TEXT;

-- Add unique constraint for active prompts per type
CREATE UNIQUE INDEX idx_active_prompts_per_type ON system_prompts (type) WHERE is_active = true;

-- Add index on key for faster lookups
CREATE INDEX idx_system_prompts_key ON system_prompts (key);

-- Update existing prompts
UPDATE system_prompts
SET type = 'profile_generation',
    key = 'default_profile_generation',
    description = 'Default prompt for generating profiles from existing person data'
WHERE name = 'Default Profile Generation Prompt';

UPDATE system_prompts
SET type = 'new_person_research',
    key = 'add_new_person',
    description = 'Prompt for researching and generating profiles for new people'
WHERE name = 'Add New Person Profile Generation';

-- Add comments
COMMENT ON COLUMN system_prompts.type IS 'Type of system prompt - determines where and how it is used';
COMMENT ON COLUMN system_prompts.version IS 'Version number for tracking prompt iterations';
COMMENT ON COLUMN system_prompts.description IS 'Human-readable description of the prompt''s purpose';
COMMENT ON COLUMN system_prompts.key IS 'Unique identifier for programmatic reference'; 