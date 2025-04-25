-- Create events table if it doesn't exist
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE
);

-- Add new columns
ALTER TABLE events
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS attendee_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS event_date DATE;

-- Copy existing dates (if any exist)
UPDATE events
SET event_date = start_time::DATE
WHERE start_time IS NOT NULL;

-- Create function to generate slug from name
CREATE OR REPLACE FUNCTION generate_event_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
  IF title IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Update existing events to have slugs
UPDATE events
SET slug = generate_event_slug(title)
WHERE slug IS NULL AND title IS NOT NULL;

-- Create function to update attendee count
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

-- Create trigger to automatically update attendee count
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