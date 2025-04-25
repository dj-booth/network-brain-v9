-- Add new JSONB columns to people table
ALTER TABLE people 
ADD COLUMN IF NOT EXISTS intros_sought JSONB[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS reasons_to_introduce JSONB[] DEFAULT '{}';

-- Migrate existing data from intros_sought table
UPDATE people p
SET intros_sought = (
  SELECT array_agg(json_build_object('title', i.title, 'description', i.description))::jsonb[]
  FROM intros_sought i
  WHERE i.person_id = p.id
);

-- Migrate existing data from reasons_to_introduce table
UPDATE people p
SET reasons_to_introduce = (
  SELECT array_agg(json_build_object('title', r.title, 'description', r.description))::jsonb[]
  FROM reasons_to_introduce r
  WHERE r.person_id = p.id
);

-- Drop the old tables
DROP TABLE IF EXISTS intros_sought;
DROP TABLE IF EXISTS reasons_to_introduce; 