import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    `Missing Supabase environment variables:\n` +
    `NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? "✓" : "✗"}\n` +
    `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: ${supabaseAnonKey ? "✓" : "✗"}`
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
