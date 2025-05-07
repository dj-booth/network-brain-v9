-- Update existing prompts to have the correct key values
UPDATE system_prompts
SET key = 'profile_generation'
WHERE name LIKE '%Profile Generation%'
  OR name LIKE '%Generate Profile%'
  OR key IS NULL;

UPDATE system_prompts
SET key = 'new_person_research'
WHERE name LIKE '%Research%'
  OR name LIKE '%New Person%'
  OR name LIKE '%Enrich%'; 