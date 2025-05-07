import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import openai from '@/lib/openai';
import { CommunityMembershipStatus } from '@/lib/types';
import { fetchPersonByLinkedIn, searchPersonByName, ProxycurlProfile, ProxycurlSearchResponse } from '@/lib/proxycurl';

console.log('PROXYCURL_API_KEY:', process.env.PROXYCURL_API_KEY);

interface ProfileGenerationResult {
  summary: string;
  detailed_summary: string;
  intros_sought: string;
  reasons_to_introduce: string;
  additional_info?: {
    linkedin_url?: string;
    company?: string;
    title?: string;
    note?: string;
    photo_url?: string;
  };
}

export async function POST(request: Request) {
  console.log('==== /api/profile/generate route HIT ====' );
  try {
    const { personId, systemPromptKey, timelineData } = await request.json();

    if (!personId) {
      console.error('Profile generation error: Missing personId');
      return NextResponse.json({ error: 'Person ID is required' }, { status: 400 });
    }

    // 1. Fetch person data
    const { data: person, error: personError } = await supabase
      .from('people')
      .select('*')
      .eq('id', personId)
      .is('deleted', false)
      .single();

    if (personError) {
      console.error('Profile generation error - Failed to fetch person:', personError);
      throw personError;
    }
    if (!person) {
      console.error('Profile generation error - Person not found:', personId);
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

    // 1.5. Enrich with Proxycurl before OpenAI
    let proxycurlData: ProxycurlProfile | null = null;
    let proxycurlChangeSummary = '';
    if (person.linkedin_url) {
      proxycurlData = await fetchPersonByLinkedIn(person.linkedin_url);
    } else if (person.name) {
      const searchResults: ProxycurlSearchResponse | null = await searchPersonByName(person.name);
      if (searchResults && searchResults.results && searchResults.results.length > 0) {
        const bestMatch = searchResults.results[0];
        if (bestMatch.linkedin_url) {
          proxycurlData = await fetchPersonByLinkedIn(bestMatch.linkedin_url);
        }
      }
    }

    // If Proxycurl returns data, update the person record with new info and log changes
    if (proxycurlData) {
      const proxycurlUpdate: any = {};
      const changes: string[] = [];
      if (proxycurlData.linkedin_url && proxycurlData.linkedin_url !== person.linkedin_url) {
        changes.push(`LinkedIn URL updated from '${person.linkedin_url || 'N/A'}' to '${proxycurlData.linkedin_url}'`);
        proxycurlUpdate.linkedin_url = proxycurlData.linkedin_url;
      }
      if (proxycurlData.full_name && proxycurlData.full_name !== person.name) {
        changes.push(`Name updated from '${person.name || 'N/A'}' to '${proxycurlData.full_name}'`);
        proxycurlUpdate.name = proxycurlData.full_name;
      }
      if (proxycurlData.occupation && proxycurlData.occupation !== person.title) {
        changes.push(`Title updated from '${person.title || 'N/A'}' to '${proxycurlData.occupation}'`);
        proxycurlUpdate.title = proxycurlData.occupation;
      }
      if (proxycurlData.company && proxycurlData.company.name && proxycurlData.company.name !== person.company) {
        changes.push(`Company updated from '${person.company || 'N/A'}' to '${proxycurlData.company.name}'`);
        proxycurlUpdate.company = proxycurlData.company.name;
      }
      if (proxycurlData.profile_pic_url && proxycurlData.profile_pic_url !== person.image_url) {
        changes.push(`Profile photo updated.`);
        proxycurlUpdate.image_url = proxycurlData.profile_pic_url;
      }
      if (Object.keys(proxycurlUpdate).length > 0) {
        await supabase.from('people').update(proxycurlUpdate).eq('id', personId);
        Object.assign(person, proxycurlUpdate);
      }
      if (changes.length > 0) {
        proxycurlChangeSummary = `Profile updated via Proxycurl: ${changes.join('; ')}.`;
        await supabase.from('notes').insert({
          person_id: personId,
          content: proxycurlChangeSummary,
          type: 'text',
          created_at: new Date().toISOString(),
        });
      }
    }

    // 2. Determine operation type and get prompt
    const promptKey = systemPromptKey || 'profile_generation';
    console.log('Looking up system prompt with key:', systemPromptKey, '->', promptKey);
    // Get the appropriate prompt
    const { data: prompt, error: promptError } = await supabase
      .from('system_prompts')
      .select('content')
      .eq('key', promptKey)
      .single();

    if (promptError || !prompt?.content) {
      console.error('Profile generation error - Failed to fetch prompt:', promptError);
      throw new Error('Failed to fetch system prompt');
    }

    // 3. Prepare context
    let context;
    if (systemPromptKey === 'enrich_profile') {
      context = {
        person: {
          name: person.name || '',
          linkedin_url: person.linkedin_url || '',
          title: person.title || '',
          company: person.company || '',
        },
        ...(proxycurlChangeSummary ? { proxycurl_change_summary: proxycurlChangeSummary } : {})
      };
    } else {
      context = {
        person: {
          name: person.name || '',
          linkedin_url: person.linkedin_url || '',
          title: person.title || '',
          company: person.company || '',
          email: person.email || '',
          location: person.location || '',
          summary: person.summary || '',
          detailed_summary: person.detailed_summary || '',
          current_focus: person.current_focus || '',
          startup_experience: person.startup_experience || '',
          skills: person.skills || [],
          interests: person.interests || [],
        },
        ...(timelineData ? { timeline: timelineData } : {}),
        ...(proxycurlChangeSummary ? { proxycurl_change_summary: proxycurlChangeSummary } : {})
      };
    }

    // 4. Generate content with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: prompt.content
        },
        {
          role: "user",
          content: JSON.stringify(context)
        }
      ],
      response_format: { type: "json_object" },
      temperature: systemPromptKey === 'enrich_profile' ? 0.7 : 0.3,
    });

    if (!completion?.choices?.[0]?.message?.content) {
      throw new Error('Empty response from AI');
    }

    const generatedContent: ProfileGenerationResult = JSON.parse(completion.choices[0].message.content);

    // 5. Validate the generated content
    const requiredFields = ['summary', 'detailed_summary', 'intros_sought', 'reasons_to_introduce'] as const;
    const missingFields = requiredFields.filter(
      (field): field is typeof requiredFields[number] => !(field in generatedContent)
    );
    if (missingFields.length > 0) {
      throw new Error(`Generated content missing required fields: ${missingFields.join(', ')}`);
    }

    // 6. Update the person record
    const updateData: any = {
      summary: generatedContent.summary,
      detailed_summary: generatedContent.detailed_summary,
      intros_sought: generatedContent.intros_sought,
      reasons_to_introduce: generatedContent.reasons_to_introduce
    };

    if (generatedContent.additional_info) {
      if (generatedContent.additional_info.linkedin_url && !person.linkedin_url) {
        updateData.linkedin_url = generatedContent.additional_info.linkedin_url;
      }
      if (generatedContent.additional_info.company && !person.company) {
        updateData.company = generatedContent.additional_info.company;
      }
      if (generatedContent.additional_info.title && !person.title) {
        updateData.title = generatedContent.additional_info.title;
      }
      if (generatedContent.additional_info.photo_url && !person.image_url) {
        updateData.image_url = generatedContent.additional_info.photo_url;
      }
    }

    const { error: updateError } = await supabase
      .from('people')
      .update(updateData)
      .eq('id', personId);

    if (updateError) {
      throw updateError;
    }

    // 7. Create a note if there's additional research information
    if (generatedContent.additional_info?.note) {
      await supabase
        .from('notes')
        .insert({
          person_id: personId,
          content: generatedContent.additional_info.note,
          type: 'text',
          created_at: new Date().toISOString()
        });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Profile generation error:', error instanceof Error ? error.stack || error.message : error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
} 