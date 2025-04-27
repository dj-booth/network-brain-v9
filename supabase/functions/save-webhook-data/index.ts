import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
Deno.serve(async (req)=>{
  if (req.method === 'POST') {
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
      const data = await req.json();
      // Assuming the data has a structure that matches your database table
      const { error } = await supabaseClient.from('your_table_name') // Replace with your actual table name
      .insert([
        data
      ]);
      if (error) {
        return new Response(JSON.stringify({
          error: error.message
        }), {
          headers: {
            'Content-Type': 'application/json'
          },
          status: 400
        });
      }
      return new Response(JSON.stringify({
        message: 'Data saved successfully!'
      }), {
        headers: {
          'Content-Type': 'application/json'
        },
        status: 200
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error.message
      }), {
        headers: {
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
  } else {
    return new Response('Method Not Allowed', {
      status: 405
    });
  }
});
