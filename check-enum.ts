import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEnumValues() {
  const { data, error } = await supabase
    .rpc('get_enum_values', { enum_name: 'response_status' });

  if (error) {
    console.error('Error getting enum values:', error);
    return;
  }

  console.log('Valid response_status values:', data);
}

checkEnumValues(); 