-- Remove the type field as it's redundant with key
ALTER TABLE system_prompts
DROP COLUMN type; 