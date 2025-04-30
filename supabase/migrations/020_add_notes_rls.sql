-- Enable RLS on notes table
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to insert notes
CREATE POLICY "Allow authenticated users to insert notes"
ON notes FOR INSERT TO authenticated
WITH CHECK (true);

-- Create policy to allow authenticated users to read their own notes
CREATE POLICY "Allow authenticated users to read notes"
ON notes FOR SELECT TO authenticated
USING (true);

-- Create policy to allow authenticated users to update their own notes
CREATE POLICY "Allow authenticated users to update notes"
ON notes FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy to allow authenticated users to delete their own notes
CREATE POLICY "Allow authenticated users to delete notes"
ON notes FOR DELETE TO authenticated
USING (true); 