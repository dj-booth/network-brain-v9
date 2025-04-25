-- Enable RLS on events table
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to read events
CREATE POLICY "Anyone can read events"
ON events FOR SELECT
TO public
USING (true);

-- Policy to allow anyone to create events
CREATE POLICY "Anyone can create events"
ON events FOR INSERT
TO public
WITH CHECK (true);

-- Policy to allow anyone to update events
CREATE POLICY "Anyone can update events"
ON events FOR UPDATE
TO public
USING (true)
WITH CHECK (true); 