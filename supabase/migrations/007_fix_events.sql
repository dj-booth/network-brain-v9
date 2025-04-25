-- Drop existing function and recreate it
DROP FUNCTION IF EXISTS generate_event_slug;

-- Recreate the function with proper error handling
CREATE OR REPLACE FUNCTION generate_event_slug(event_title TEXT)
RETURNS TEXT AS $$
BEGIN
  IF event_title IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN lower(regexp_replace(event_title, '[^a-zA-Z0-9]+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Ensure all events have slugs
UPDATE events
SET slug = generate_event_slug(title)
WHERE slug IS NULL AND title IS NOT NULL;

-- Add trigger for automatic slug generation
CREATE OR REPLACE FUNCTION update_event_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.title IS NOT NULL THEN
    NEW.slug = generate_event_slug(NEW.title);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic slug updates
DROP TRIGGER IF EXISTS update_event_slug_trigger ON events;
CREATE TRIGGER update_event_slug_trigger
BEFORE INSERT OR UPDATE OF title ON events
FOR EACH ROW
EXECUTE FUNCTION update_event_slug(); 