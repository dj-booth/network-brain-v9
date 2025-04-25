-- Create response_status enum type
CREATE TYPE response_status AS ENUM (
  'consider_for_invite',
  'to_invite',
  'invited',
  'attending',
  'rsvp_accepted',
  'rsvp_maybe',
  'rsvp_declined'
);

-- Create event_attendees table
CREATE TABLE IF NOT EXISTS event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  person_id UUID NOT NULL,
  response_status response_status NOT NULL DEFAULT 'consider_for_invite',
  UNIQUE(event_id, person_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_person_id ON event_attendees(person_id);

-- Create trigger to automatically update attendee count
CREATE OR REPLACE FUNCTION update_event_attendee_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events 
    SET attendee_count = attendee_count + 1
    WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events 
    SET attendee_count = attendee_count - 1
    WHERE id = OLD.event_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_event_attendee_count_trigger ON event_attendees;
CREATE TRIGGER update_event_attendee_count_trigger
AFTER INSERT OR DELETE ON event_attendees
FOR EACH ROW
EXECUTE FUNCTION update_event_attendee_count();

-- Update existing events' attendee counts
UPDATE events e
SET attendee_count = (
  SELECT COUNT(*)
  FROM event_attendees ea
  WHERE ea.event_id = e.id
); 