import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

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
  intros_sought?: string;
  reasons_to_introduce?: string;
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
  metadata?: Record<string, unknown>;
};

export type Event = {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description?: string;
  short_description?: string;
  event_date: string;
  location?: string;
  slug: string;
  attendee_count: number;
}; 