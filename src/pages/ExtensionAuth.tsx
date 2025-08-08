import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// This lightweight page is opened by the Chrome extension to grab the current Supabase session
// and post it back to the extension popup (window.opener). If the user isn't logged in yet,
// it listens for auth state change and then posts the session when available.
export default function ExtensionAuth() {
  const [status, setStatus] = useState<'connecting' | 'signing-in' | 'success'>('connecting');
  const [countdown, setCountdown] = useState(5);
  
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const target = window.opener || window.parent;

        // Helper to post session back to the opener
        const postSession = (sess: any) => {
          try {
            console.log('ExtensionAuth: Posting session to opener:', sess?.user?.email);
            console.log('ExtensionAuth: Target window:', target);
            console.log('ExtensionAuth: Current origin:', window.location.origin);
            // Post to the opener (chrome extension) with wildcard origin
            target?.postMessage({ type: 'SUPABASE_SESSION', session: sess }, '*');
            console.log('ExtensionAuth: Message posted successfully');
          } catch (err) {
            console.error('Failed to post session to opener:', err);
          }
        };

        if (session) {
          console.log('ExtensionAuth: User already signed in, posting session');
          setStatus('success');
          postSession(session);
          
          // Start countdown and close after 5 seconds
          let count = 5;
          setCountdown(count);
          const timer = setInterval(() => {
            count -= 1;
            setCountdown(count);
            if (count <= 0) {
              clearInterval(timer);
              window.close();
            }
          }, 1000);
          return;
        }

        console.log('ExtensionAuth: No session found, user needs to sign in');
        setStatus('signing-in');
        
        // Redirect to auth page with a return parameter to come back here
        console.log('ExtensionAuth: Redirecting to /auth for sign in');
        setTimeout(() => {
          window.location.href = '/auth?return=extension-auth';
        }, 1000);

        // Also set up listener in case user signs in in this window
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
          console.log('ExtensionAuth: Auth state changed:', event, newSession?.user?.email);
          if (newSession && event === 'SIGNED_IN') {
            console.log('ExtensionAuth: User signed in, posting session');
            setStatus('success');
            postSession(newSession);
            
            // Start countdown and close after 5 seconds
            let count = 5;
            setCountdown(count);
            const timer = setInterval(() => {
              count -= 1;
              setCountdown(count);
              if (count <= 0) {
                clearInterval(timer);
                window.close();
              }
            }, 1000);
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

  const renderContent = () => {
    switch (status) {
      case 'connecting':
        return (
          <>
            <div className="w-16 h-16 mx-auto bg-black rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" height="32px" viewBox="0 -960 960 960" width="32px" fill="#FFFFFF">
                <path d="M480-80q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80ZM320-200v-80h320v80H320Zm10-120q-69-41-109.5-110T180-580q0-125 87.5-212.5T480-880q125 0 212.5 87.5T780-580q0 81-40.5 150T630-320H330Zm24-80h252q45-32 69.5-79T700-580q0-92-64-156t-156-64q-92 0-156 64t-64 156q0 54 24.5 101t69.5 79Zm126 0Z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold">Connecting Chrome Extension</h1>
            <p className="text-sm text-muted-foreground max-w-md">
              Checking if you're signed in...
            </p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mx-auto"></div>
          </>
        );
      
      case 'signing-in':
        return (
          <>
            <div className="w-16 h-16 mx-auto bg-blue-500 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" height="32px" viewBox="0 -960 960 960" width="32px" fill="#FFFFFF">
                <path d="M480-120v-80h280v-560H480v-80h280q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H480Zm-80-160-55-58 102-102H120v-80h327L345-622l55-58 200 200-200 200Z"/>
              </svg>
            </div>
            <h1 className="text-xl font-semibold">Sign In Required</h1>
            <p className="text-sm text-muted-foreground max-w-md">
              Redirecting to sign in page...
            </p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
          </>
        );
      
      case 'success':
        return (
          <>
            <div className="w-16 h-16 mx-auto bg-green-500 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" height="32px" viewBox="0 -960 960 960" width="32px" fill="#FFFFFF">
                <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/>
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-green-600">Success!</h1>
            <p className="text-sm text-muted-foreground max-w-md">
              You can now add web pages to your Supamind feed using the Chrome extension.
            </p>
            <p className="text-xs text-gray-400">
              This window closes in {countdown} seconds
            </p>
            <div className="w-6 h-6 mx-auto bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{countdown}</span>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        {renderContent()}
      </div>
    </div>
  );
}


