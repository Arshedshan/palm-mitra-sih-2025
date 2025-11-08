// supabase/functions/gemini-bot/index.ts
/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/deno/types.d.ts" />

import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai';

// Language map
const langMap: Record<string, string> = {
  'en': 'English',
  'hi': 'Hindi',
  'ta': 'Tamil',
};

// 1. Get the Gemini API Key
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
if (!GEMINI_API_KEY) {
  console.error("FATAL: GEMINI_API_KEY environment variable not set!");
  throw new Error("Server configuration error: Missing Gemini API Key.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

console.log("Gemini Bot Function Initialized (Simplified Version)");

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
      status: 204, // No Content
    });
  }

  try {
    // 2. Get prompt and language from the request body
    const requestBody = await req.clone().json().catch(() => ({}));
    const prompt = requestBody.prompt;
    const langCode = requestBody.language || 'en'; // Get lang from request
    const langName = langMap[langCode] || 'English';

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
         headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 400
      });
    }

    console.log(`Received prompt: "${prompt}" for language: ${langName}`);

    // 3. Create the full prompt for Gemini
    // We removed all the Supabase client logic that was here
    const fullPrompt = `You are a helpful expert on Indian oil palm farming. 
      Please answer the following question in ${langName}.
      Question: ${prompt}`;

    console.log("Sending prompt to Gemini...");

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("Received reply from Gemini:", text);

    // 4. Send the reply back
    return new Response(JSON.stringify({ reply: text }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 200,
    });

  } catch (error: any) { 
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: error.message || "An internal error occurred." }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 500,
    });
  }
});