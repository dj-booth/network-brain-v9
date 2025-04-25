-- First, drop any RLS policies if they exist
DROP POLICY IF EXISTS "Anyone can read event attendees" ON event_attendees;
DROP POLICY IF EXISTS "Anyone can create event attendees" ON event_attendees;
DROP POLICY IF EXISTS "Anyone can update event attendees" ON event_attendees;

-- Drop the attendee count trigger first
DROP TRIGGER IF EXISTS update_event_attendee_count_trigger ON event_attendees;

-- Add community_id column as nullable if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'event_attendees'
        AND column_name = 'community_id'
    ) THEN
        ALTER TABLE event_attendees ADD COLUMN community_id UUID REFERENCES communities(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Recreate the attendee count trigger
CREATE OR REPLACE FUNCTION update_event_attendee_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events 
    SET attendee_count = attendee_count + 1
    WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events 
    SET attendee_count = GREATEST(attendee_count - 1, 0)
    WHERE id = OLD.event_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Add back the attendee count trigger
CREATE TRIGGER update_event_attendee_count_trigger
AFTER INSERT OR DELETE ON event_attendees
FOR EACH ROW
EXECUTE FUNCTION update_event_attendee_count();

-- Enable RLS on event_attendees if not already enabled
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can read event attendees"
ON event_attendees FOR SELECT
TO public
USING (true);

CREATE POLICY "Anyone can create event attendees"
ON event_attendees FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Anyone can update event attendees"
ON event_attendees FOR UPDATE
TO public
USING (true)
WITH CHECK (true); 