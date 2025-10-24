import { createClient, type Session } from '@supabase/supabase-js';

// SECURITY: These values must be injected at build time via environment variables
// Never hardcode credentials in source code
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing required Supabase configuration. Please check build configuration.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function loadSavedSession() {
  const { supabaseSession } = await chrome.storage.local.get('supabaseSession');
  const session = supabaseSession?.session as Session | undefined;
  if (session) {
    await supabase.auth.setSession(session);
  }
}

export async function saveSession(session: Session | null) {
  await chrome.storage.local.set({ supabaseSession: { session } });
}


