
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Global subscription management to prevent duplicate subscriptions
const activeSubscriptions = new Map<string, { channel: any; refCount: number }>();

export const useNotebooks = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: notebooks = [],
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ['notebooks', user?.id],
    queryFn: async () => {
      if (!user) {
        console.log('No user found, returning empty notebooks array');
        return [];
      }
      
      console.log('Fetching notebooks for authenticated user');
      
      // First get the notebooks
      const { data: notebooksData, error: notebooksError } = await supabase
        .from('notebooks')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (notebooksError) {
        console.error('Error fetching notebooks:', notebooksError);
        throw notebooksError;
      }

      // Then get source counts separately for each notebook
      const notebooksWithCounts = await Promise.all(
        (notebooksData || []).map(async (notebook) => {
          const { count, error: countError } = await supabase
            .from('sources')
            .select('*', { count: 'exact', head: true })
            .eq('notebook_id', notebook.id);

          if (countError) {
            console.error('Error fetching source count for notebook:', notebook.id, countError);
            return { ...notebook, sources: [{ count: 0 }] };
          }

          return { ...notebook, sources: [{ count: count || 0 }] };
        })
      );

      console.log('Fetched notebooks:', notebooksWithCounts?.length || 0);
      return notebooksWithCounts || [];
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

  // Set up real-time subscription for notebooks updates (singleton pattern)
  useEffect(() => {
    if (!user?.id || !isAuthenticated) return;

    const subscriptionKey = `notebooks-${user.id}`;
    const existing = activeSubscriptions.get(subscriptionKey);
    
    if (existing) {
      existing.refCount++;
      console.log(`Reusing existing Realtime subscription for notebooks, refCount: ${existing.refCount}`);
      
      return () => {
        existing.refCount--;
        console.log(`Decremented notebooks subscription refCount: ${existing.refCount}`);
        if (existing.refCount === 0) {
          console.log('Last component unmounted, cleaning up Realtime subscription for notebooks');
          supabase.removeChannel(existing.channel);
          activeSubscriptions.delete(subscriptionKey);
        }
      };
    }

    console.log('Creating new Realtime subscription for notebooks');

    const channel = supabase
      .channel('notebooks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notebooks',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time notebook update received:', payload);
          
          // Invalidate and refetch notebooks when any change occurs
          queryClient.invalidateQueries({ queryKey: ['notebooks', user.id] });
        }
      )
      .subscribe();

    activeSubscriptions.set(subscriptionKey, { channel, refCount: 1 });

    return () => {
      const sub = activeSubscriptions.get(subscriptionKey);
      if (sub) {
        sub.refCount--;
        console.log(`Decremented notebooks subscription refCount: ${sub.refCount}`);
        if (sub.refCount === 0) {
          console.log('Last component unmounted, cleaning up Realtime subscription for notebooks');
          supabase.removeChannel(sub.channel);
          activeSubscriptions.delete(subscriptionKey);
        }
      }
    };
  }, [user?.id, isAuthenticated]);

  const createNotebook = useMutation({
    mutationFn: async (notebookData: { title: string; description?: string }) => {
      console.log('Creating notebook with data:', notebookData);
      console.log('Creating notebook for authenticated user');
      
      if (!user) {
        console.error('User not authenticated');
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('notebooks')
        .insert({
          title: notebookData.title,
          description: notebookData.description,
          user_id: user.id,
          generation_status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating notebook:', error);
        throw error;
      }
      
      console.log('Notebook created successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Mutation success, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['notebooks', user?.id] });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
    },
  });

  return {
    notebooks,
    isLoading: authLoading || isLoading,
    error: error?.message || null,
    isError,
    createNotebook: createNotebook.mutate,
    isCreating: createNotebook.isPending,
  };
};
