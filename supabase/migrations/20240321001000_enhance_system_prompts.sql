-- Create enum for system prompt types
CREATE TYPE system_prompt_type AS ENUM (
    'profile_generation',
    'new_person_research'
);

-- Add new columns to system_prompts table
ALTER TABLE system_prompts
ADD COLUMN type system_prompt_type NOT NULL DEFAULT 'profile_generation',
ADD COLUMN version INTEGER NOT NULL DEFAULT 1,
ADD COLUMN description TEXT;

-- Add a unique constraint to ensure only one active prompt per type
CREATE UNIQUE INDEX idx_active_prompt_per_type 
ON system_prompts (type) 
WHERE is_active = true;

-- Update existing prompts
UPDATE system_prompts
SET type = 'profile_generation',
    version = 1,
    description = 'Default profile generation prompt for existing people'
WHERE name = 'Default Profile Generation Prompt';

UPDATE system_prompts
SET type = 'new_person_research',
    version = 1,
    description = 'Enhanced research prompt for creating new person profiles'
WHERE name = 'Add New Person Research Prompt';

-- Add comment to explain the table
COMMENT ON TABLE system_prompts IS 'Stores different types of system prompts with versioning support';
COMMENT ON COLUMN system_prompts.type IS 'Type of prompt (e.g., profile generation, new person research)';
COMMENT ON COLUMN system_prompts.version IS 'Version number for this type of prompt';
COMMENT ON COLUMN system_prompts.description IS 'Detailed description of what this prompt does'; 