import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface MatchedPerson {
  id: string;
  name: string;
  title: string | null;
  company: string | null;
  summary: string | null;
  image_url: string | null;
  similarity: number;
}

interface Person {
  id: string;
  name: string;
  title: string | null;
  company: string | null;
  summary: string | null;
  image_url: string | null;
  embedding: number[];
  reasons_to_introduce: string | null;
}

interface Introduction {
  id: string;
  person_a_id: string;
  person_b_id: string;
  matching_score: number;
  status: string;
  matching_rationale: {
    source_reason: string;
    target_reason: string;
  };
}

const SIMILARITY_THRESHOLD = 0.78; // Adjust this value to control match quality
const MAX_MATCHES = 5; // Maximum number of introductions to generate

export async function POST(request: Request) {
  try {
    const { personId } = await request.json();

    if (!personId) {
      return NextResponse.json({ error: 'Person ID is required' }, { status: 400 });
    }

    // Fetch the source person's embedding
    const { data: sourcePerson, error: sourceError } = await supabase
      .from('people')
      .select('*')
      .eq('id', personId)
      .single();

    if (sourceError) throw sourceError;
    if (!sourcePerson || !sourcePerson.embedding) {
      return NextResponse.json({ error: 'Source person embedding not found' }, { status: 404 });
    }

    // Find similar people using vector similarity search
    const { data: matches, error: matchError } = await supabase
      .rpc('match_people', {
        query_embedding: sourcePerson.embedding,
        match_threshold: SIMILARITY_THRESHOLD,
        match_count: MAX_MATCHES,
        source_person_id: personId
      });

    if (matchError) throw matchError;
    if (!matches?.length) {
      return NextResponse.json({ message: 'No suitable matches found' });
    }

    // Generate introduction rationales for each match
    const introductions = await Promise.all(matches.map(async (match: MatchedPerson) => {
      // Create a new introduction record
      const { data: intro, error: introError } = await supabase
        .from('introductions')
        .insert({
          person_a_id: personId,
          person_b_id: match.id,
          matching_score: match.similarity,
          status: 'generated',
          matching_rationale: {
            source_reason: generateSourceReason(sourcePerson as Person, match),
            target_reason: generateTargetReason(sourcePerson as Person, match)
          }
        })
        .select(`
          *,
          people:person_b_id (*)
        `)
        .single();

      if (introError) {
        console.error('Error creating introduction:', introError);
        return null;
      }

      return intro;
    }));

    // Filter out any failed introductions
    const successfulIntroductions = introductions.filter((intro): intro is Introduction => intro !== null);

    return NextResponse.json({
      success: true,
      introductions: successfulIntroductions
    });

  } catch (error) {
    console.error('Introduction generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate introductions' },
      { status: 500 }
    );
  }
}

function generateSourceReason(sourcePerson: Person, matchPerson: MatchedPerson): string {
  const reasons = [];
  
  if (matchPerson.title) {
    reasons.push(`They are a ${matchPerson.title}`);
  }
  
  if (matchPerson.company) {
    reasons.push(`at ${matchPerson.company}`);
  }

  return reasons.length > 0 ? reasons.join(' ') : 'They might be a valuable connection';
}

function generateTargetReason(sourcePerson: Person, matchPerson: MatchedPerson): string {
  const reasons = [];
  
  if (sourcePerson.title) {
    reasons.push(`They are a ${sourcePerson.title}`);
  }
  
  if (sourcePerson.company) {
    reasons.push(`at ${sourcePerson.company}`);
  }
  
  if (sourcePerson.reasons_to_introduce) {
    reasons.push(sourcePerson.reasons_to_introduce);
  }

  return reasons.length > 0 ? reasons.join(' ') : 'They might be interested in connecting';
} 