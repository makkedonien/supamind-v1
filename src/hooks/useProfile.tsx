import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

interface UpdateProfileData {
  summary_prompt?: string | null;
  deep_dive_prompt?: string | null;
  categorization_prompt?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
}

export const useProfile = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: profile,
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async (): Promise<Profile | null> => {
      if (!user) {
        console.log('No user found, returning null profile');
        return null;
      }
      
      console.log('Fetching profile for user:', user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }

      console.log('Fetched profile:', data);
      return data;
    },
    enabled: isAuthenticated && !authLoading,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error?.message?.includes('JWT') || error?.message?.includes('auth')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (updateData: UpdateProfileData) => {
      console.log('Updating profile with data:', updateData);
      
      if (!user) {
        console.error('User not authenticated');
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }
      
      console.log('Profile updated successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Profile update success, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast({
        title: "Success",
        description: "Profile updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Profile update error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updatePrompts = useMutation({
    mutationFn: async (promptData: {
      summary_prompt?: string | null;
      deep_dive_prompt?: string | null;
      categorization_prompt?: string | null;
    }) => {
      console.log('Updating AI prompts with data:', promptData);
      
      if (!user) {
        console.error('User not authenticated');
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(promptData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating prompts:', error);
        throw error;
      }
      
      console.log('Prompts updated successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Prompts update success, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast({
        title: "Success",
        description: "AI prompts updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Prompts update error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update AI prompts. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    profile,
    isLoading: authLoading || isLoading,
    error: error?.message || null,
    isError,
    updateProfile: updateProfile.mutate,
    isUpdating: updateProfile.isPending,
    updatePrompts: updatePrompts.mutate,
    isUpdatingPrompts: updatePrompts.isPending,
  };
};