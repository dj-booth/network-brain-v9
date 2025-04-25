-- Rename summary to title if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'events'
        AND column_name = 'summary'
    ) THEN
        ALTER TABLE events RENAME COLUMN summary TO title;
    END IF;
END $$;

-- Add missing columns if they don't exist
ALTER TABLE events
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS attendee_count INTEGER DEFAULT 0;

-- Make sure event_date exists and copy data from start_time if needed
ALTER TABLE events
ADD COLUMN IF NOT EXISTS event_date DATE;

-- Copy existing dates from start_time if they exist
UPDATE events
SET event_date = start_time::DATE
WHERE start_time IS NOT NULL AND event_date IS NULL;

-- Make event_date required
ALTER TABLE events
ALTER COLUMN event_date SET NOT NULL;

-- Ensure title is required
ALTER TABLE events
ALTER COLUMN title SET NOT NULL;

-- Update existing slugs
UPDATE events
SET slug = lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL AND title IS NOT NULL;

-- Update existing attendee counts
UPDATE events e
SET attendee_count = COALESCE((
  SELECT COUNT(*)
  FROM event_attendees ea
  WHERE ea.event_id = e.id
), 0);

-- Add trigger for automatic slug generation if it doesn't exist
CREATE OR REPLACE FUNCTION update_event_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.title IS NOT NULL THEN
    NEW.slug = lower(regexp_replace(NEW.title, '[^a-zA-Z0-9]+', '-', 'g'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic slug updates if it doesn't exist
DROP TRIGGER IF EXISTS update_event_slug_trigger ON events;
CREATE TRIGGER update_event_slug_trigger
BEFORE INSERT OR UPDATE OF title ON events
FOR EACH ROW
EXECUTE FUNCTION update_event_slug();

-- Create function to update attendee count if it doesn't exist
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

-- Create trigger to automatically update attendee count if it doesn't exist
DROP TRIGGER IF EXISTS update_event_attendee_count_trigger ON event_attendees;
CREATE TRIGGER update_event_attendee_count_trigger
AFTER INSERT OR DELETE ON event_attendees
FOR EACH ROW
EXECUTE FUNCTION update_event_attendee_count(); 