import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// This lightweight page is opened by the Chrome extension to grab the current Supabase session
// and post it back to the extension popup (window.opener). If the user isn't logged in yet,
// it listens for auth state change and then posts the session when available.
export default function ExtensionAuth() {
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const target = window.opener || window.parent;

        // Helper to post session back to the opener
        const postSession = (sess: any) => {
          try {
            // Post to the opener with the current origin for safety
            target?.postMessage({ type: 'SUPABASE_SESSION', session: sess }, window.location.origin);
          } catch (err) {
            console.error('Failed to post session to opener:', err);
          }
        };

        if (session) {
          postSession(session);
          return;
        }

        // Not signed in yet, wait for auth state change
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
          if (newSession) {
            postSession(newSession);
          }
        });
        unsubscribe = () => subscription.unsubscribe();
      } catch (error) {
        console.error('ExtensionAuth: error obtaining session', error);
      }
    })();

    return () => {
      try { unsubscribe?.(); } catch {}
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-2">
        <h1 className="text-lg font-semibold">Connecting the Chrome Extension…</h1>
        <p className="text-sm text-muted-foreground">If prompted, sign in. This window will close automatically.</p>
      </div>
    </div>
  );
}


