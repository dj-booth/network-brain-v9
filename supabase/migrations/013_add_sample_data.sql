-- Update existing people with sample intros and reasons data
UPDATE people
SET 
    intros_sought = ARRAY[
        jsonb_build_object(
            'title', 'Tech Leaders',
            'description', 'Looking to connect with CTOs and VPs of Engineering at growing startups'
        ),
        jsonb_build_object(
            'title', 'Product Managers',
            'description', 'Interested in meeting PMs working on AI/ML products'
        ),
        jsonb_build_object(
            'title', 'Startup Founders',
            'description', 'Want to meet founders building in the B2B SaaS space'
        )
    ]::jsonb[],
    reasons_to_introduce = ARRAY[
        jsonb_build_object(
            'title', 'Engineering Leadership Mentorship',
            'description', 'Can mentor engineering managers and directors transitioning to senior leadership roles'
        ),
        jsonb_build_object(
            'title', 'Technical Architecture Review',
            'description', 'Available for architecture reviews and consulting on scaling distributed systems'
        ),
        jsonb_build_object(
            'title', 'Startup Advising',
            'description', 'Experienced in helping early-stage startups with technical strategy and team building'
        )
    ]::jsonb[]
WHERE id IN (
    SELECT id FROM people ORDER BY RANDOM() LIMIT 2
);

-- Add different set of intros and reasons to other people
UPDATE people
SET 
    intros_sought = ARRAY[
        jsonb_build_object(
            'title', 'Investors',
            'description', 'Seeking connections with seed and Series A investors in enterprise software'
        ),
        jsonb_build_object(
            'title', 'Sales Leaders',
            'description', 'Looking to meet experienced enterprise sales leaders'
        ),
        jsonb_build_object(
            'title', 'Marketing Directors',
            'description', 'Want to connect with B2B marketing leaders'
        )
    ]::jsonb[],
    reasons_to_introduce = ARRAY[
        jsonb_build_object(
            'title', 'Go-to-Market Strategy',
            'description', 'Can advise on GTM strategy for enterprise software companies'
        ),
        jsonb_build_object(
            'title', 'Fundraising',
            'description', 'Happy to share insights on fundraising and investor relationships'
        ),
        jsonb_build_object(
            'title', 'Network Access',
            'description', 'Can make introductions to relevant investors and potential customers'
        )
    ]::jsonb[]
WHERE id IN (
    SELECT id 
    FROM people 
    WHERE id NOT IN (
        SELECT id FROM people WHERE intros_sought IS NOT NULL
    )
    ORDER BY RANDOM() 
    LIMIT 2
); 