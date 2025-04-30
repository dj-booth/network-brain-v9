import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import openai from '@/lib/openai';
import { CommunityMembershipStatus } from '@/lib/types';

interface Person {
  id: string;
  name: string;
  email: string | null;
  title: string | null;
  company: string | null;
  location: string | null;
  skills: string[] | null;
  interests: string[] | null;
  current_focus: string | null;
  startup_experience: string | null;
  last_startup_role: string | null;
  preferred_role: string | null;
  preferred_company_stage: string | null;
  long_term_goal: string | null;
}

interface Note {
  content: string;
  created_at: string;
}

interface Event {
  title: string | null;
  description: string | null;
  start_time: string;
  event_attendees: Array<{ response_status: string }>;
}

interface Community {
  id: string;
  name: string;
  description: string | null;
}

interface CommunityMembership {
  membership_status: CommunityMembershipStatus | null;
  community: Community;
}

export async function POST(request: Request) {
  try {
    const { personId } = await request.json();

    if (!personId) {
      console.error('Profile generation error: Missing personId');
      return NextResponse.json({ error: 'Person ID is required' }, { status: 400 });
    }

    // 1. Fetch person data
    const { data: person, error: personError } = await supabase
      .from('people')
      .select('*')
      .eq('id', personId)
      .single();

    if (personError) {
      console.error('Profile generation error - Failed to fetch person:', personError);
      throw personError;
    }
    if (!person) {
      console.error('Profile generation error - Person not found:', personId);
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

    // 2. Fetch timeline items (notes and events)
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('*')
      .eq('person_id', personId)
      .order('created_at', { ascending: false });

    if (notesError) {
      console.error('Profile generation error - Failed to fetch notes:', notesError);
      throw notesError;
    }

    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select(`
        id,
        title,
        description,
        start_time,
        event_attendees!inner (
          response_status
        )
      `)
      .eq('event_attendees.person_id', personId)
      .order('start_time', { ascending: false });

    if (eventsError) {
      console.error('Profile generation error - Failed to fetch events:', eventsError);
      throw eventsError;
    }

    // 3. Fetch community memberships
    const { data: memberships, error: membershipError } = await supabase
      .from('community_members')
      .select(`
        membership_status,
        community:communities (
          id,
          name,
          description
        )
      `)
      .eq('person_id', personId);

    if (membershipError) {
      console.error('Profile generation error - Failed to fetch memberships:', membershipError);
      throw membershipError;
    }

    // Check if we have any data to generate from
    if (!notes?.length && !events?.length && !memberships?.length) {
      console.warn('Profile generation warning - No timeline data available for:', personId);
    }

    // 4. Prepare the context for OpenAI
    const context = {
      person: {
        name: (person as Person).name || '',
        email: (person as Person).email || '',
        title: (person as Person).title || '',
        company: (person as Person).company || '',
        location: (person as Person).location || '',
        skills: (person as Person).skills || [],
        interests: (person as Person).interests || [],
        current_focus: (person as Person).current_focus || '',
        startup_experience: (person as Person).startup_experience || '',
        last_startup_role: (person as Person).last_startup_role || '',
        preferred_role: (person as Person).preferred_role || '',
        preferred_company_stage: (person as Person).preferred_company_stage || '',
        long_term_goal: (person as Person).long_term_goal || ''
      },
      timeline: {
        notes: (notes as Note[] || []).map(note => ({
          content: note.content,
          created_at: note.created_at
        })),
        events: (events as Event[] || []).map(event => ({
          title: event.title || '',
          description: event.description || '',
          date: event.start_time,
          status: event.event_attendees[0].response_status
        }))
      },
      communities: (memberships || []).map(membership => {
        const community = membership.community || {};
        return {
          name: (community as any).name || '',
          status: membership.membership_status || 'prospect',
          description: (community as any).description || ''
        };
      })
    };

    // 5. Generate content with OpenAI
    const systemPrompt = `You are a professional profile writer. Your task is to generate four sections of a person's profile based on their data, timeline of interactions, and community memberships. Keep the tone professional and focus on their professional attributes, achievements, and potential.

Rules for each section:
1. Summary: A concise overview limited to 250 characters. Focus on current role, key expertise, and standout qualities.
2. About (Detailed Summary): A comprehensive professional background (500-1000 characters). Include experience, achievements, and current focus areas.
3. Looking to Connect With: Clear description of desired connections (200-400 characters). Be specific about roles, industries, or expertise sought.
4. Ways They Can Help: Concrete ways they can assist others (200-400 characters). Focus on their expertise, experience, and what they can offer.

Format the response as a JSON object with these exact keys: summary, detailed_summary, intros_sought, reasons_to_introduce`;

    let completion;
    try {
      // Check OpenAI configuration
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables.');
      }

      console.log('Profile generation - Sending request to OpenAI with context:', {
        personId,
        contextLength: JSON.stringify(context).length,
        hasNotes: notes?.length > 0,
        hasEvents: events?.length > 0,
        hasMemberships: memberships?.length > 0,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY
      });

      completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: JSON.stringify(context)
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      console.log('Profile generation - Received OpenAI response:', {
        status: 'success',
        hasContent: !!completion?.choices?.[0]?.message?.content,
        contentLength: completion?.choices?.[0]?.message?.content?.length
      });

    } catch (openaiError: any) {
      // Log the complete error object for debugging
      console.error('Profile generation error - OpenAI API error details:', {
        error: openaiError,
        message: openaiError.message,
        type: openaiError.type,
        status: openaiError.status,
        code: openaiError.code,
        stack: openaiError.stack,
        response: openaiError.response?.data
      });
      
      // Handle specific OpenAI error cases
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key is not configured');
      } else if (openaiError.status === 401) {
        throw new Error('OpenAI API key is invalid or expired');
      } else if (openaiError.status === 429) {
        throw new Error('OpenAI API rate limit exceeded - please try again in a few minutes');
      } else if (openaiError.status === 500) {
        throw new Error('OpenAI API internal server error - please try again');
      } else if (openaiError.response?.data?.error?.message) {
        throw new Error(`OpenAI API error: ${openaiError.response.data.error.message}`);
      }
      
      throw openaiError; // Throw the original error if none of the above cases match
    }

    if (!completion?.choices?.[0]?.message?.content) {
      console.error('Profile generation error - Empty OpenAI response');
      throw new Error('Empty response from AI');
    }

    let generatedContent;
    try {
      generatedContent = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      console.error('Profile generation error - Failed to parse OpenAI response:', parseError);
      throw new Error('Invalid response format from AI');
    }

    // Validate the generated content
    const requiredFields = ['summary', 'detailed_summary', 'intros_sought', 'reasons_to_introduce'];
    const missingFields = requiredFields.filter(field => !generatedContent[field]);
    if (missingFields.length > 0) {
      console.error('Profile generation error - Missing fields in generated content:', missingFields);
      throw new Error(`Generated content missing required fields: ${missingFields.join(', ')}`);
    }

    // 6. Update the person record
    const { error: updateError } = await supabase
      .from('people')
      .update({
        summary: generatedContent.summary,
        detailed_summary: generatedContent.detailed_summary,
        intros_sought: generatedContent.intros_sought,
        reasons_to_introduce: generatedContent.reasons_to_introduce,
        last_generated_at: new Date().toISOString()
      })
      .eq('id', personId);

    if (updateError) {
      console.error('Profile generation error - Failed to update person record:', updateError);
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      data: generatedContent
    });

  } catch (error) {
    console.error('Profile generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: `Failed to generate profile: ${errorMessage}` },
      { status: 500 }
    );
  }
} 