import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return (
    !!supabaseUrl &&
    !!supabaseAnonKey &&
    supabaseUrl.startsWith("https://") &&
    !supabaseUrl.includes("placeholder") &&
    !supabaseUrl.includes("your_")
  );
};

// Only create real Supabase client if configured, otherwise create a mock
let supabaseInstance: SupabaseClient | null = null;

if (isSupabaseConfigured()) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}

// Mock auth object for when Supabase is not configured
const mockAuth = {
  getSession: async () => ({ data: { session: null }, error: null }),
  onAuthStateChange: (_callback: unknown) => ({
    data: { subscription: { unsubscribe: () => {} } },
  }),
  signOut: async () => ({ error: null }),
  signInWithPassword: async () => ({
    data: null,
    error: new Error("Supabase not configured"),
  }),
  signInWithOAuth: async () => ({
    data: null,
    error: new Error("Supabase not configured"),
  }),
  signInWithIdToken: async () => ({
    data: null,
    error: new Error("Supabase not configured"),
  }),
};

// Export a safe supabase object that works even without configuration
export const supabase =
  supabaseInstance ||
  ({
    auth: mockAuth,
  } as unknown as SupabaseClient);
