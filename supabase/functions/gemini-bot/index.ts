// supabase/functions/gemini-bot/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai';

const langMap: Record<string, string> = {
  'en': 'English',
  'hi': 'Hindi',
  'ta': 'Tamil',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY environment variable not set!");
  // Return an error response immediately if the key is missing
  return new Response(JSON.stringify({ error: "Server configuration error: Missing API Key." }), {
    headers: { 'Content-Type': 'application/json' },
    status: 500,
  });
}

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
    const { prompt } = await req.json();
    console.log("Received prompt:", prompt); // Log received prompt

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
         headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 400
      });
    }

    const authHeader = req.headers.get('Authorization');
    console.log("Auth Header:", authHeader ? "Present" : "Missing"); // Log auth header presence

    // Create Supabase client to get user profile (optional for this function if language is passed)
    // You might pass the language directly in the request body instead
    // For simplicity in the prototype, let's assume language comes from request or defaults
    const requestBody = await req.json().catch(() => ({})); // Get body again safely
    let lang = requestBody.language || 'en'; // Attempt to get language from request body
    let langName = langMap[lang] || 'English';

    // If Authorization header exists, try fetching profile for more robust language detection
    if (authHeader) {
       try {
          const supabaseClient = createClient(
             Deno.env.get('SUPABASE_URL') ?? '',
             Deno.env.get('SUPABASE_ANON_KEY') ?? '',
             { global: { headers: { Authorization: authHeader } } }
          );
          const { data: { user } } = await supabaseClient.auth.getUser();
          if (user) {
             const { data: profile } = await supabaseClient
               .from('farmers')
               .select('language')
               .eq('user_id', user.id)
               .single();
             if (profile?.language) {
                lang = profile.language;
                langName = langMap[lang] || 'English';
                console.log("Language fetched from profile:", langName);
             } else {
                console.log("User found but no language in profile, using default/request language.");
             }
          } else {
            console.log("Auth header present but couldn't get user.");
          }
       } catch(profileError) {
          console.error("Error fetching user profile:", profileError);
          // Fallback to default/request language if profile fetch fails
       }
    } else {
      console.log("No auth header, using default/request language:", langName);
    }


    const fullPrompt = `You are a helpful expert on Indian oil palm farming. A farmer who speaks ${langName} has a question. Answer simply and clearly, in ${langName}. Question: ${prompt}`;
    console.log("Sending prompt to Gemini:", fullPrompt);

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    console.log("Received reply from Gemini:", text);

    return new Response(JSON.stringify({ reply: text }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, // Add CORS header
      status: 200,
    });

  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: error.message || "An internal error occurred." }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, // Add CORS header
      status: 500,
    });
  }
});