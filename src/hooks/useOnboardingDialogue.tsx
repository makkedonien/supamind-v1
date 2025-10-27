import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type DialogueType = 'feed_dialogue' | 'microcast_dialogue' | 'podcast_dialogue' | 'settings_dialogue';

interface OnboardingDialogues {
  feed_dialogue: boolean;
  microcast_dialogue: boolean;
  podcast_dialogue: boolean;
  settings_dialogue: boolean;
}

export const useOnboardingDialogue = (dialogueType: DialogueType) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Load the onboarding dialogue state from the database
  useEffect(() => {
    const loadDialogueState = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarding_dialogues')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        const dialogues = data?.onboarding_dialogues as OnboardingDialogues;
        
        // Show the dialogue if it hasn't been dismissed yet (value is false)
        if (dialogues && !dialogues[dialogueType]) {
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Error loading onboarding dialogue state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDialogueState();
  }, [user, dialogueType]);

  // Mark the dialogue as dismissed
  const dismissDialogue = async () => {
    if (!user) return;

    setIsUpdating(true);

    try {
      // First, get the current onboarding_dialogues state
      const { data: currentData, error: fetchError } = await supabase
        .from('profiles')
        .select('onboarding_dialogues')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const currentDialogues = currentData?.onboarding_dialogues as OnboardingDialogues || {
        feed_dialogue: false,
        microcast_dialogue: false,
        podcast_dialogue: false,
        settings_dialogue: false,
      };

      // Update only the specific dialogue type to true
      const updatedDialogues = {
        ...currentDialogues,
        [dialogueType]: true,
      };

      // Update the database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ onboarding_dialogues: updatedDialogues })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Close the dialogue
      setIsOpen(false);
    } catch (error) {
      console.error('Error dismissing onboarding dialogue:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    isOpen,
    setIsOpen,
    isLoading,
    isUpdating,
    dismissDialogue,
  };
};

