-- Create communities table
CREATE TABLE IF NOT EXISTS communities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES people(id) ON DELETE SET NULL
);

-- Add community_id to events table
ALTER TABLE events
ADD COLUMN community_id UUID REFERENCES communities(id) ON DELETE SET NULL;

-- Add indexes
CREATE INDEX idx_events_community_id ON events(community_id);

-- Add trigger for updated_at
CREATE TRIGGER update_communities_updated_at
    BEFORE UPDATE ON communities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 