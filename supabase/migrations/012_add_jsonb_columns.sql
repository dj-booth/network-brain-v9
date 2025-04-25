-- Add new JSONB columns to people table
ALTER TABLE people 
ADD COLUMN IF NOT EXISTS intros_sought JSONB[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS reasons_to_introduce JSONB[] DEFAULT '{}'; 