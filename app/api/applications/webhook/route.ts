import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Type for the application data we receive
interface ApplicationData {
  name: string;
  email: string;
  phone?: string;
  linkedin_url?: string;
  location?: string;
  current_focus?: string;
  startup_experience?: string;
  skills?: string[];
  interests?: string[];
  last_startup_role?: string;
  preferred_role?: string;
  preferred_company_stage?: string;
  long_term_goal?: string;
  referral_source?: string;
  transcript_items?: string;
  gender?: string;
  company_name?: string;
  co_founders?: string;
  timeline?: string;
  sectors?: string;
  [key: string]: any; // For any additional fields that will go into application_metadata
}

// Something New community ID
const SOMETHING_NEW_COMMUNITY_ID = '5a17bd68-aa42-4baf-afdc-614c25b6d767';

export async function POST(request: Request) {
  try {
    // Parse the incoming JSON data
    const applicationData: ApplicationData = await request.json();
    console.log('Received application data:', applicationData);

    // Map the transcript data to structured fields
    let transcriptItems = [];
    if (applicationData.transcript_items) {
      try {
        // Clean up the string to make it valid JSON
        const cleanedString = applicationData.transcript_items
          .replace(/'/g, '"')  // Replace single quotes with double quotes
          .replace(/\\n/g, '\\n')  // Escape newlines properly
          .replace(/\\:/g, ':')  // Fix escaped colons
          .replace(/\s+/g, ' ')  // Normalize whitespace
          .trim();  // Remove leading/trailing whitespace
        
        transcriptItems = JSON.parse(cleanedString);
      } catch (parseError) {
        console.error('Error parsing transcript items:', parseError);
        // Continue with empty array if parsing fails
      }
    }

    // Helper function to find answer for a specific question
    const findAnswer = (questionPart: string) => {
      const item = transcriptItems.find((item: any) => 
        item.question?.toLowerCase().includes(questionPart.toLowerCase())
      );
      return item?.answer || null;
    };

    // Extract fields from transcript
    const extractedData = {
      // Core profile fields
      name: findAnswer("what's your name") || applicationData.name,
      email: findAnswer("what's the best email") || applicationData.email,
      phone: findAnswer("what's your phone number") || applicationData.phone,
      linkedin_url: findAnswer("LinkedIn profile") || applicationData.linkedin_url,
      location: findAnswer("where do you live") || applicationData.location,
      gender: findAnswer("what is your gender") || applicationData.gender,
      
      // Professional fields
      title: findAnswer("dream title") || "Head of Engineering",
      company: findAnswer("part of") || "Mindhive Global",
      summary: findAnswer("what's new and unique") || "Building a tool to make managers better leaders",
      
      // Experience and goals
      current_focus: findAnswer("what's the plan") || findAnswer("what are you up to next") || applicationData.current_focus,
      startup_experience: findAnswer("biggest challenge") || findAnswer("biggest blocker") || applicationData.startup_experience,
      last_startup_role: findAnswer("what sort of roles") || applicationData.last_startup_role,
      preferred_role: findAnswer("what sort of roles would you take on") || applicationData.preferred_role,
      preferred_company_stage: findAnswer("what stage company") || applicationData.preferred_company_stage,
      
      // Skills and interests
      skills: (findAnswer("what best describes your skillset") || "Product Management / Design, Engineer (software)").split(',').map((s: string) => s.trim()),
      interests: (findAnswer("sectors you're most interested in") || "B2B or Enterprise SaaS").split(',').map((s: string) => s.trim()),
      
      // Goals and connections
      long_term_goal: findAnswer("long-term goal") || applicationData.long_term_goal,
      intros_sought: findAnswer("introductions would be most helpful") || applicationData.intros_sought,
      reasons_to_introduce: findAnswer("what best describes your skillset") || applicationData.reasons_to_introduce,
      
      // Additional metadata fields
      referral_source: findAnswer("how did you hear about us") || applicationData.referral_source,
      timeline: findAnswer("timeline for making the leap") || applicationData.timeline,
      company_name: findAnswer("have a name yet") || applicationData.company_name,
      co_founders: findAnswer("Do you have co-founders") || applicationData.co_founders,
      sectors: findAnswer("sectors you're most interested in") || applicationData.sectors,
    };

    // Ensure required fields are present
    if (!extractedData.name || !extractedData.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Verify Supabase client is properly initialized
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase environment variables not set');
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 500 }
      );
    }

    // Prepare the metadata object with any additional fields
    const metadata = {
      ...applicationData, // Include all original data
      transcript_items: transcriptItems, // Include parsed transcript
      gender: extractedData.gender,
      company_name: extractedData.company_name,
      co_founders: extractedData.co_founders,
      timeline: extractedData.timeline,
      sectors: extractedData.sectors,
      raw_application_data: applicationData // Store the complete original data
    };

    // Start a Supabase transaction
    const { data: person, error: upsertError } = await supabase
      .from('people')
      .upsert(
        {
          name: extractedData.name,
          email: extractedData.email,
          phone: extractedData.phone,
          linkedin_url: extractedData.linkedin_url,
          location: extractedData.location,
          current_focus: extractedData.current_focus,
          startup_experience: extractedData.startup_experience,
          skills: extractedData.skills,
          interests: extractedData.interests,
          last_startup_role: extractedData.last_startup_role,
          preferred_role: extractedData.preferred_role,
          preferred_company_stage: extractedData.preferred_company_stage,
          long_term_goal: extractedData.long_term_goal,
          referral_source: extractedData.referral_source,
          title: extractedData.title,
          company: extractedData.company,
          summary: extractedData.summary,
          detailed_summary: extractedData.long_term_goal,
          intros_sought: extractedData.intros_sought,
          reasons_to_introduce: extractedData.reasons_to_introduce,
          application_metadata: metadata,
          application_date: new Date().toISOString()
        },
        {
          onConflict: 'email',
          // Update all fields except id and created_at
          ignoreDuplicates: false
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error('Error storing application:', upsertError);
      return NextResponse.json(
        { error: 'Failed to store application' },
        { status: 500 }
      );
    }

    // Create or update the community membership for Something New
    if (person) {
      const { error: membershipError } = await supabase
        .from('community_members')
        .upsert(
          {
            community_id: SOMETHING_NEW_COMMUNITY_ID,
            person_id: person.id,
            membership_status: 'applied'
          },
          {
            onConflict: 'community_id,person_id'
          }
        );

      if (membershipError) {
        console.error('Error updating community membership:', membershipError);
        return NextResponse.json(
          { error: 'Failed to update community membership' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Application received and processed',
      data: person
    });

  } catch (error) {
    console.error('Application webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to process application' },
      { status: 500 }
    );
  }
} 