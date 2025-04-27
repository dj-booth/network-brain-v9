import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase, type Person } from '@/lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to prepare text for embedding
function prepareTextForEmbedding(person: Person, additionalContext?: string) {
  const parts = [
    `Name: ${person.name}`,
    person.title && `Title: ${person.title}`,
    person.company && `Company: ${person.company}`,
    person.summary && `Summary: ${person.summary}`,
    person.detailed_summary && `Details: ${person.detailed_summary}`,
    person.intros_sought && `Looking to meet: ${person.intros_sought}`,
    person.reasons_to_introduce && `Can help with: ${person.reasons_to_introduce}`,
    additionalContext && `Current Context: ${additionalContext}`,
  ].filter(Boolean); // Remove undefined/null values

  return parts.join('\n');
}

// Helper function to generate embedding
async function generateEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });

  return response.data[0].embedding;
}

export async function POST(request: Request) {
  try {
    const { personId, additionalContext } = await request.json();

    if (!personId) {
      return NextResponse.json({ error: 'Person ID is required' }, { status: 400 });
    }

    // Fetch person data
    const { data: person, error: fetchError } = await supabase
      .from('people')
      .select('*')
      .eq('id', personId)
      .single();

    if (fetchError) throw fetchError;
    if (!person) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

    // Prepare text and generate embedding
    const text = prepareTextForEmbedding(person, additionalContext);
    const embedding = await generateEmbedding(text);

    // Update person with new embedding
    const { error: updateError } = await supabase
      .from('people')
      .update({
        embedding: embedding,
        embedding_updated_at: new Date().toISOString(),
        embedding_version: 'text-embedding-ada-002',
        last_embedding_data: {
          text_length: text.length,
          fields_included: Object.keys(person).filter(k => person[k]),
          generated_at: new Date().toISOString(),
          includes_additional_context: !!additionalContext
        }
      })
      .eq('id', personId);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: 'Embedding generated and stored successfully'
    });

  } catch (error) {
    console.error('Embedding generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate embedding' },
      { status: 500 }
    );
  }
}

// Also add a GET endpoint to generate embeddings for all people
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch people without embeddings or with old embeddings
    const { data: people, error: fetchError } = await supabase
      .from('people')
      .select('*')
      .is('embedding', null)
      .range(offset, offset + limit - 1);

    if (fetchError) throw fetchError;
    if (!people?.length) {
      return NextResponse.json({ message: 'No people need embedding updates' });
    }

    // Generate embeddings for each person
    const results = await Promise.all(
      people.map(async (person) => {
        try {
          const text = prepareTextForEmbedding(person);
          const embedding = await generateEmbedding(text);

          const { error: updateError } = await supabase
            .from('people')
            .update({
              embedding: embedding,
              embedding_updated_at: new Date().toISOString(),
              embedding_version: 'text-embedding-ada-002',
              last_embedding_data: {
                text_length: text.length,
                fields_included: Object.keys(person).filter(k => person[k]),
                generated_at: new Date().toISOString()
              }
            })
            .eq('id', person.id);

          if (updateError) throw updateError;
          return { id: person.id, success: true };
        } catch (error) {
          console.error(`Error processing person ${person.id}:`, error);
          return { id: person.id, success: false, error };
        }
      })
    );

    return NextResponse.json({
      success: true,
      processed: results.length,
      results
    });

  } catch (error) {
    console.error('Batch embedding generation error:', error);
    return NextResponse.json(
      { error: 'Failed to process batch embedding generation' },
      { status: 500 }
    );
  }
} 