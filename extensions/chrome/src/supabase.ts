import { createClient, type Session } from '@supabase/supabase-js';

// Inject your project URL and anon key at build time or fill in here for local dev
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'or hardcode here';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'or hardcode here';

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


