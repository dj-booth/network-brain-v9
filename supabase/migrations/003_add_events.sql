-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    is_past_event BOOLEAN DEFAULT false,
    created_by UUID REFERENCES people(id) ON DELETE SET NULL
);

-- Create event_attendees junction table
CREATE TABLE IF NOT EXISTS event_attendees (
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (event_id, person_id)
);

-- Add indexes
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_is_past_event ON events(is_past_event);
CREATE INDEX idx_event_attendees_person_id ON event_attendees(person_id);

-- Add trigger for updated_at
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 