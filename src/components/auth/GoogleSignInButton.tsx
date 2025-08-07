import React, { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Declare global google object for TypeScript
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            nonce?: string;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          renderButton: (element: HTMLElement, options: {
            type?: string;
            shape?: string;
            theme?: string;
            text?: string;
            size?: string;
            logo_alignment?: string;
          }) => void;
        };
      };
    };
    handleSignInWithGoogle?: (response: { credential: string }) => void;
  }
}

interface GoogleSignInButtonProps {
  onSignInStart?: () => void;
  onSignInComplete?: () => void;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSignInStart,
  onSignInComplete,
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleSignInWithGoogle = async (response: { credential: string }) => {
    onSignInStart?.();
    
    try {
      console.log('Google Sign-In: Attempting to sign in with ID token');
      
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      });

      if (error) {
        console.error('Google Sign-In error:', error);
        throw error;
      }

      console.log('Google Sign-In successful:', data.user?.email);

      onSignInComplete?.();
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      toast({
        title: "Google Sign-In Error",
        description: error.message || "Failed to sign in with Google. Please try again.",
        variant: "destructive",
      });
      onSignInComplete?.();
    }
  };

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (!window.google || !buttonRef.current) {
        return;
      }

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      
      if (!clientId) {
        console.error('Google Client ID not found. Please add VITE_GOOGLE_CLIENT_ID to your environment variables.');
        return;
      }

      // Make the callback function globally available
      window.handleSignInWithGoogle = handleSignInWithGoogle;

      try {
        // Initialize Google Sign-In
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleSignInWithGoogle,
          use_fedcm_for_prompt: true, // For Chrome's third-party cookie phase-out compatibility
        });

        // Render the sign-in button
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          shape: 'pill',
          theme: 'outline',
          text: 'signin_with',
          size: 'large',
          logo_alignment: 'left',
        });
      } catch (error) {
        console.error('Failed to initialize Google Sign-In:', error);
      }
    };

    // Check if Google script is already loaded
    if (window.google) {
      initializeGoogleSignIn();
    } else {
      // Wait for Google script to load
      const checkGoogleLoaded = setInterval(() => {
        if (window.google) {
          clearInterval(checkGoogleLoaded);
          initializeGoogleSignIn();
        }
      }, 100);

      // Clean up interval after 10 seconds
      setTimeout(() => clearInterval(checkGoogleLoaded), 10000);
    }

    // Cleanup
    return () => {
      if (window.handleSignInWithGoogle) {
        delete window.handleSignInWithGoogle;
      }
    };
  }, []);

  return (
    <div className="w-full">
      <div ref={buttonRef} className="w-full flex justify-center" />
    </div>
  );
};

export default GoogleSignInButton;