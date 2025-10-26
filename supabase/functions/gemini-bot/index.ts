// supabase/functions/gemini-bot/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai';

const langMap: Record<string, string> = {
  'en': 'English',
  'hi': 'Hindi',
  'ta': 'Tamil',
};

// --- FIX: Check API Key and Throw Error if Missing ---
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
if (!GEMINI_API_KEY) {
  console.error("FATAL: GEMINI_API_KEY environment variable not set!");
  // Throwing an error stops the function boot process cleanly
  throw new Error("Server configuration error: Missing API Key.");
  // REMOVED: return new Response(...) - This was the illegal statement
}
// --------------------------------------------------

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

console.log("Gemini Bot Function Initialized"); // Log on startup

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*', // Be more specific in production
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
      status: 204, // No Content
    });
  }

  try {
    // Double-check key *inside* handler? Optional, usually not needed if boot check works.
    // const currentApiKey = Deno.env.get('GEMINI_API_KEY');
    // if (!currentApiKey) {
    //   return new Response(JSON.stringify({ error: "API Key missing at runtime."}), { status: 500, ...corsHeaders });
    // }

    // Use req.clone() if reading body multiple times
    const requestBody = await req.clone().json().catch(() => ({}));
    const prompt = requestBody.prompt;
    console.log("Received prompt:", prompt); // Log received prompt

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
         headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 400
      });
    }

    const authHeader = req.headers.get('Authorization');
    console.log("Auth Header:", authHeader ? "Present" : "Missing");

    let lang = requestBody.language || 'en'; // Attempt to get language from request body
    let langName = langMap[lang] || 'English';

    // Fetch profile language if authenticated (keep this logic)
    if (authHeader) {
       try {
          const supabaseClient = createClient( /* ... Supabase credentials ... */ );
          const { data: { user } } = await supabaseClient.auth.getUser();
          if (user) {
             const { data: profile } = await supabaseClient.from('farmers').select('language').eq('user_id', user.id).single();
             if (profile?.language) {
                lang = profile.language;
                langName = langMap[lang] || 'English';
                console.log("Language fetched from profile:", langName);
             } else { console.log("User found but no language in profile..."); }
          } else { console.log("Auth header present but couldn't get user."); }
       } catch(profileError) { console.error("Error fetching user profile:", profileError); }
    } else { console.log("No auth header, using default/request language:", langName); }


    const fullPrompt = `You are a helpful expert on Indian oil palm farming... Question: ${prompt}`; // Keep prompt generation
    console.log("Sending prompt to Gemini:", fullPrompt);

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    console.log("Received reply from Gemini:", text);

    return new Response(JSON.stringify({ reply: text }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 200,
    });

  } catch (error: any) { // Catch errors during request handling
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: error.message || "An internal error occurred." }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 500,
    });
  }
});
