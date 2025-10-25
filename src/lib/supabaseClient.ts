// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uwetmuhxsmqudibxyivl.supabase.co' // <-- Replace
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3ZXRtdWh4c21xdWRpYnh5aXZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MDcyODIsImV4cCI6MjA3Njk4MzI4Mn0.Smjmk5w7gNnm43i7E8adWE__8Y2YB6lqaWrIBL_mu6E' // <-- Replace

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL and Key must be provided in supabaseClient.ts");
}

export const supabase = createClient(supabaseUrl, supabaseKey)