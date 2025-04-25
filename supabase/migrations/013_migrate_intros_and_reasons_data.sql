-- Begin transaction to ensure data consistency
BEGIN;

-- First, let's count the records in both tables for verification
DO $$
DECLARE
    intros_count INTEGER;
    reasons_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO intros_count FROM intros_sought;
    SELECT COUNT(*) INTO reasons_count FROM reasons_to_introduce;
    
    RAISE NOTICE 'Before migration: % intros_sought records, % reasons_to_introduce records', 
        intros_count, reasons_count;
END $$;

-- Migrate existing data from intros_sought table
UPDATE people p
SET intros_sought = (
    SELECT array_agg(json_build_object('title', i.title, 'description', i.description))::jsonb[]
    FROM intros_sought i
    WHERE i.person_id = p.id
);

-- Migrate existing data from reasons_to_introduce table
UPDATE people p
SET reasons_to_introduce = (
    SELECT array_agg(json_build_object('title', r.title, 'description', r.description))::jsonb[]
    FROM reasons_to_introduce r
    WHERE r.person_id = p.id
);

-- Verify the migration
DO $$
DECLARE
    people_with_intros INTEGER;
    people_with_reasons INTEGER;
    total_intros INTEGER;
    total_reasons INTEGER;
BEGIN
    -- Count people who have intros/reasons
    SELECT COUNT(*) INTO people_with_intros 
    FROM people 
    WHERE array_length(intros_sought, 1) > 0;
    
    SELECT COUNT(*) INTO people_with_reasons 
    FROM people 
    WHERE array_length(reasons_to_introduce, 1) > 0;
    
    -- Count total intros/reasons in old tables
    SELECT COUNT(*) INTO total_intros FROM intros_sought;
    SELECT COUNT(*) INTO total_reasons FROM reasons_to_introduce;
    
    RAISE NOTICE 'Migration results:';
    RAISE NOTICE '- People with intros: %', people_with_intros;
    RAISE NOTICE '- Original intros count: %', total_intros;
    RAISE NOTICE '- People with reasons: %', people_with_reasons;
    RAISE NOTICE '- Original reasons count: %', total_reasons;
    
    -- If counts don't match, raise an error
    IF (SELECT COUNT(*) FROM (
        SELECT person_id, COUNT(*) as count FROM intros_sought GROUP BY person_id
    ) s WHERE s.count != (
        SELECT array_length(intros_sought, 1) 
        FROM people 
        WHERE id = s.person_id
    )) > 0 THEN
        RAISE EXCEPTION 'Mismatch in intros_sought counts';
    END IF;
    
    IF (SELECT COUNT(*) FROM (
        SELECT person_id, COUNT(*) as count FROM reasons_to_introduce GROUP BY person_id
    ) r WHERE r.count != (
        SELECT array_length(reasons_to_introduce, 1) 
        FROM people 
        WHERE id = r.person_id
    )) > 0 THEN
        RAISE EXCEPTION 'Mismatch in reasons_to_introduce counts';
    END IF;
END $$;

COMMIT; 