-- Create the match_people function for vector similarity search
CREATE OR REPLACE FUNCTION match_people(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  source_person_id uuid
)
RETURNS TABLE (
  id uuid,
  name text,
  title text,
  company text,
  summary text,
  image_url text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.title,
    p.company,
    p.summary,
    p.image_url,
    1 - (p.embedding <=> query_embedding) as similarity
  FROM people p
  WHERE
    -- Exclude the source person
    p.id != source_person_id
    -- Only include people with embeddings
    AND p.embedding IS NOT NULL
    -- Exclude deleted people
    AND (p.deleted IS NULL OR p.deleted = false)
    -- Exclude people who already have an introduction with the source person
    AND NOT EXISTS (
      SELECT 1 FROM introductions i
      WHERE (i.person_a_id = source_person_id AND i.person_b_id = p.id)
         OR (i.person_b_id = source_person_id AND i.person_a_id = p.id)
    )
    -- Apply similarity threshold
    AND 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Add comment to the function
COMMENT ON FUNCTION match_people IS 'Finds similar people based on embedding similarity, excluding existing introductions';

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION match_people TO authenticated; 