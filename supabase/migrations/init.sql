-- Create enum for note types
CREATE TYPE note_type AS ENUM ('text', 'voice');

-- Create people table
CREATE TABLE IF NOT EXISTS people (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    email TEXT,
    -- Add indexes for faster searching
    CONSTRAINT email_unique UNIQUE (email)
);
CREATE INDEX idx_people_name ON people USING GIN (to_tsvector('english', name));

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type note_type DEFAULT 'text',
    -- Add any metadata fields we might need for voice notes later
    voice_duration_seconds INTEGER,
    voice_transcript TEXT,
    -- Add indexes for faster querying
    CONSTRAINT content_not_empty CHECK (length(trim(content)) > 0)
);
CREATE INDEX idx_notes_person_id ON notes(person_id);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_people_updated_at
    BEFORE UPDATE ON people
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create some initial test data
INSERT INTO people (name, email) VALUES
    ('John Doe', 'john@example.com'),
    ('Jane Smith', 'jane@example.com'),
    ('Bob Johnson', 'bob@example.com')
ON CONFLICT (email) DO NOTHING; 