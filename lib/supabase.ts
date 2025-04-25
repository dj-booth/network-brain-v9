import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for our database tables
export type Person = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email?: string;
  title?: string;
  company?: string;
  summary?: string;
  detailed_summary?: string;
  image_url?: string;
  last_contact?: string;
};

export type Note = {
  id: string;
  created_at: string;
  updated_at: string;
  person_id: string;
  content: string;
  type: 'text' | 'voice';
  voice_duration_seconds?: number;
  voice_transcript?: string;
};

export type Community = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description?: string;
  short_description?: string;
  website_url?: string;
  logo_url?: string;
  banner_image_url?: string;
  location?: string;
  is_private: boolean;
  is_verified: boolean;
  member_count: number;
  slug: string;
  social_links?: Record<string, string>;
  contact_email?: string;
  created_by?: string;
  metadata?: Record<string, any>;
};

export type Event = {
  id: string;
  created_at: string;
  updated_at: string;
  summary: string;
  description?: string;
  location?: string;
  color_id?: string;
  start_time: string;
  end_time?: string;
  timezone?: string;
  all_day: boolean;
  recurrence?: string[];
  status: 'confirmed' | 'tentative' | 'cancelled';
  visibility: 'default' | 'public' | 'private';
  is_past_event: boolean;
  guest_can_invite_others: boolean;
  guest_can_modify: boolean;
  guest_can_see_other_guests: boolean;
  max_attendees?: number;
  source?: string;
  attachments?: any[];
  conference_data?: Record<string, any>;
  reminders?: Record<string, any>;
  community_id?: string;
  created_by?: string;
  organizer_email?: string;
  metadata?: Record<string, any>;
}; 