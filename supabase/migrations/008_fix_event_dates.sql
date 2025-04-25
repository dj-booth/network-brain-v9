-- Drop the start_time column as we're using event_date instead
ALTER TABLE events
DROP COLUMN IF EXISTS start_time;

-- Make event_date required since it's a core field
ALTER TABLE events
ALTER COLUMN event_date SET NOT NULL;

-- Update the trigger function to handle dates
CREATE OR REPLACE FUNCTION update_event_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.title IS NOT NULL THEN
    NEW.slug = generate_event_slug(NEW.title);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql; 