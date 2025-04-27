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
      return NextResponse.json({ error: 'Person ID is required' }, { status: 400 });
    }

    // 1. Fetch person data
    const { data: person, error: personError } = await supabase
      .from('people')
      .select('*')
      .eq('id', personId)
      .single();

    if (personError) throw personError;
    if (!person) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

    // 2. Fetch timeline items (notes and events)
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('*')
      .eq('person_id', personId)
      .order('created_at', { ascending: false });

    if (notesError) throw notesError;

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

    if (eventsError) throw eventsError;

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

    if (membershipError) throw membershipError;

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

    const completion = await openai.chat.completions.create({
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

    const generatedContent = JSON.parse(completion.choices[0].message.content || '{}');

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

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      data: generatedContent
    });

  } catch (error) {
    console.error('Profile generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate profile' },
      { status: 500 }
    );
  }
} 