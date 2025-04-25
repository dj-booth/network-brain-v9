-- Add new columns to people table
ALTER TABLE people
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS detailed_summary TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '/placeholder-avatar.svg',
ADD COLUMN IF NOT EXISTS last_contact DATE;

-- Create tables for intros sought and reasons to introduce
CREATE TABLE IF NOT EXISTS intros_sought (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reasons_to_introduce (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL
);

-- Add triggers for new tables
CREATE TRIGGER update_intros_sought_updated_at
    BEFORE UPDATE ON intros_sought
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reasons_to_introduce_updated_at
    BEFORE UPDATE ON reasons_to_introduce
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update existing test data with more information
UPDATE people
SET 
    title = CASE email 
        WHEN 'john@example.com' THEN 'Software Engineer'
        WHEN 'jane@example.com' THEN 'Product Manager'
        WHEN 'bob@example.com' THEN 'Marketing Director'
    END,
    company = CASE email
        WHEN 'john@example.com' THEN 'Tech Solutions Inc.'
        WHEN 'jane@example.com' THEN 'Innovation Labs'
        WHEN 'bob@example.com' THEN 'Growth Marketing Co.'
    END,
    summary = CASE email
        WHEN 'john@example.com' THEN 'Experienced software engineer specializing in full-stack development.'
        WHEN 'jane@example.com' THEN 'Product manager focused on user-centric design and agile methodologies.'
        WHEN 'bob@example.com' THEN 'Marketing director with expertise in digital transformation and growth strategies.'
    END,
    image_url = '/placeholder-avatar.svg',
    last_contact = CURRENT_DATE - (random() * 30)::integer
WHERE email IN ('john@example.com', 'jane@example.com', 'bob@example.com'); 