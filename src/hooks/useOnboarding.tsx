import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from './useProfile';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

type OnboardingPage = 'feed' | 'microcasts' | 'notebooks';

interface OnboardingState {
  needsOnboarding: boolean;
  isLoading: boolean;
  completeOnboarding: () => void;
  isCompleting: boolean;
}

export const useOnboarding = (page: OnboardingPage): OnboardingState => {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCompleting, setIsCompleting] = useState(false);

  const getCompletionField = (page: OnboardingPage) => {
    switch (page) {
      case 'feed':
        return 'onboarding_completed_feed';
      case 'microcasts':
        return 'onboarding_completed_microcasts';
      case 'notebooks':
        return 'onboarding_completed_notebooks';
      default:
        return 'onboarding_completed_feed';
    }
  };

  const updateOnboardingMutation = useMutation({
    mutationFn: async (page: OnboardingPage) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const field = getCompletionField(page);
      const { data, error } = await supabase
        .from('profiles')
        .update({ [field]: true })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating onboarding status:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate profile query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      setIsCompleting(false);
    },
    onError: (error) => {
      console.error('Onboarding completion error:', error);
      setIsCompleting(false);
      toast({
        title: "Error",
        description: "Failed to save onboarding progress. You may see this tutorial again.",
        variant: "destructive",
      });
    },
  });

  const completeOnboarding = () => {
    if (user && !isCompleting) {
      setIsCompleting(true);
      updateOnboardingMutation.mutate(page);
    }
  };

  const needsOnboarding = (() => {
    if (!profile || profileLoading) return false;
    
    const field = getCompletionField(page);
    const fieldValue = profile[field as keyof typeof profile];
    // Field is null or false means onboarding is needed
    return fieldValue !== true;
  })();

  return {
    needsOnboarding,
    isLoading: profileLoading,
    completeOnboarding,
    isCompleting: isCompleting || updateOnboardingMutation.isPending,
  };
};