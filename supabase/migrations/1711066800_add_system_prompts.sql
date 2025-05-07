-- Create system_prompts table
CREATE TABLE system_prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add initial system prompt
INSERT INTO system_prompts (name, content, is_active)
VALUES (
    'Default Profile Generation Prompt',
    'You are a professional profile writer. Your task is to generate four sections of a person''s profile based on their data, timeline of interactions, and community memberships. Keep the tone professional and focus on their professional attributes, achievements, and potential.

Rules for each section:
1. Summary: A concise overview limited to 250 characters. Focus on current role, key expertise, and standout qualities.
2. About (Detailed Summary): A comprehensive professional background (500-1000 characters). Include experience, achievements, and current focus areas.
3. Looking to Connect With: Clear description of desired connections (200-400 characters). Be specific about roles, industries, or expertise sought.
4. Ways They Can Help: Concrete ways they can assist others (200-400 characters). Focus on their expertise, experience, and what they can offer.

Format the response as a JSON object with these exact keys: summary, detailed_summary, intros_sought, reasons_to_introduce',
    true
);

-- Add RLS policies
ALTER TABLE system_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON system_prompts
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON system_prompts
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON system_prompts
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_system_prompts_updated_at
    BEFORE UPDATE ON system_prompts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 