import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, useCallback, useRef } from 'react';

// Global subscription management to prevent duplicate subscriptions
const activeSubscriptions = new Map<string, { channel: any; refCount: number }>();

export const useFeedSources = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [displayLimit, setDisplayLimit] = useState(20); // Start with 20 items
  const [totalCount, setTotalCount] = useState(0);

  // Query for all sources to track total count and handle real-time updates
  const {
    data: allSources = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['feed-sources', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('sources')
        .select('*')
        .eq('user_id', user.id)
        .is('notebook_id', null)
        .neq('type', 'podcast') // Exclude podcast sources
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Update total count when allSources changes
  useEffect(() => {
    setTotalCount(allSources.length);
  }, [allSources.length]);

  // Get the limited sources for display
  const sources = allSources.slice(0, displayLimit);

  // Load more function
  const loadMore = useCallback(() => {
    setDisplayLimit(prev => prev + 12);
  }, []);

  // Reset display limit when user changes
  useEffect(() => {
    setDisplayLimit(20);
  }, [user?.id]);

  // Check if there are more sources to load
  const hasMore = displayLimit < totalCount;

  // Set up Realtime subscription for feed sources (singleton pattern)
  useEffect(() => {
    if (!user?.id) return;

    const subscriptionKey = `feed-sources-${user.id}`;
    
    // Check if subscription already exists
    const existing = activeSubscriptions.get(subscriptionKey);
    
    if (existing) {
      // Increment ref count for existing subscription
      existing.refCount++;
      console.log(`Reusing existing Realtime subscription for feed sources, refCount: ${existing.refCount}`);
      
      return () => {
        // Decrement ref count on cleanup
        existing.refCount--;
        console.log(`Decremented feed sources subscription refCount: ${existing.refCount}`);
        
        // Only remove channel when last component unmounts
        if (existing.refCount === 0) {
          console.log('Last component unmounted, cleaning up Realtime subscription for feed sources');
          supabase.removeChannel(existing.channel);
          activeSubscriptions.delete(subscriptionKey);
        }
      };
    }

    // Create new subscription
    console.log('Creating new Realtime subscription for feed sources');

    const channel = supabase
      .channel('feed-sources-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'sources',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          console.log('Realtime: Feed sources change received:', payload);
          
          // Only handle sources without notebook_id (feed sources) and exclude podcasts
          const source = payload.new || payload.old;
          if (source?.notebook_id !== null || source?.type === 'podcast') return;
          
          // Update the query cache based on the event type
          queryClient.setQueryData(['feed-sources', user.id], (oldSources: any[] = []) => {
            switch (payload.eventType) {
              case 'INSERT':
                const newSource = payload.new as any;
                const existsInsert = oldSources.some(source => source.id === newSource?.id);
                if (existsInsert) {
                  console.log('Feed source already exists, skipping INSERT:', newSource?.id);
                  return oldSources;
                }
                console.log('Adding new feed source to cache:', newSource);
                return [newSource, ...oldSources];
                
              case 'UPDATE':
                const updatedSource = payload.new as any;
                console.log('Updating feed source in cache:', updatedSource?.id);
                return oldSources.map(source => 
                  source.id === updatedSource?.id ? updatedSource : source
                );
                
              case 'DELETE':
                const deletedSource = payload.old as any;
                console.log('Removing feed source from cache:', deletedSource?.id);
                return oldSources.filter(source => source.id !== deletedSource?.id);
                
              default:
                console.log('Unknown event type:', payload.eventType);
                return oldSources;
            }
          });
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status for feed sources:', status);
      });

    // Store the new subscription
    activeSubscriptions.set(subscriptionKey, { channel, refCount: 1 });

    return () => {
      const sub = activeSubscriptions.get(subscriptionKey);
      if (sub) {
        sub.refCount--;
        console.log(`Decremented feed sources subscription refCount: ${sub.refCount}`);
        
        // Only remove channel when last component unmounts
        if (sub.refCount === 0) {
          console.log('Last component unmounted, cleaning up Realtime subscription for feed sources');
          supabase.removeChannel(sub.channel);
          activeSubscriptions.delete(subscriptionKey);
        }
      }
    };
  }, [user?.id]);

  const addSource = useMutation({
    mutationFn: async (sourceData: {
      title: string;
      type: 'pdf' | 'text' | 'website' | 'youtube' | 'audio' | 'podcast';
      content?: string;
      url?: string;
      file_path?: string;
      file_size?: number;
      processing_status?: string;
      metadata?: any;
      image_url?: string;
      is_favorite?: boolean;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('sources')
        .insert({
          user_id: user.id,
          notebook_id: null, // Explicitly set to null for feed sources
          title: sourceData.title,
          type: sourceData.type,
          content: sourceData.content,
          url: sourceData.url,
          file_path: sourceData.file_path,
          file_size: sourceData.file_size,
          processing_status: sourceData.processing_status,
          metadata: sourceData.metadata || {},
          image_url: sourceData.image_url,
          is_favorite: sourceData.is_favorite || false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newSource) => {
      console.log('Feed source added successfully:', newSource);
      // The Realtime subscription will handle updating the cache
    },
  });

  const updateSource = useMutation({
    mutationFn: async ({ sourceId, updates }: { 
      sourceId: string; 
      updates: Record<string, any>;
    }) => {
      const { data, error } = await supabase
        .from('sources')
        .update(updates)
        .eq('id', sourceId)
        .eq('user_id', user?.id) // Ensure user can only update their own sources
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      console.log('Feed source updated successfully');
      // The Realtime subscription will handle updating the cache
    },
  });

  const deleteSource = useMutation({
    mutationFn: async (sourceId: string) => {
      console.log('Starting feed source deletion process for:', sourceId);
      
      try {
        // First, get the source details including file information
        const { data: source, error: fetchError } = await supabase
          .from('sources')
          .select('id, title, file_path, type')
          .eq('id', sourceId)
          .eq('user_id', user?.id) // Ensure user can only delete their own sources
          .single();

        if (fetchError) {
          console.error('Error fetching feed source:', fetchError);
          throw new Error('Failed to find source');
        }

        console.log('Found feed source to delete:', source.title, 'with file_path:', source.file_path);

        // Delete the file from storage if it exists
        if (source.file_path) {
          console.log('Deleting file from storage:', source.file_path);
          
          const { error: storageError } = await supabase.storage
            .from('sources')
            .remove([source.file_path]);

          if (storageError) {
            console.error('Error deleting file from storage:', storageError);
            // Don't throw here - we still want to delete the database record
          } else {
            console.log('File deleted successfully from storage');
          }
        } else {
          console.log('No file to delete from storage (URL-based source or no file_path)');
        }

        // Delete the source record from the database
        const { error: deleteError } = await supabase
          .from('sources')
          .delete()
          .eq('id', sourceId)
          .eq('user_id', user?.id); // Ensure user can only delete their own sources

        if (deleteError) {
          console.error('Error deleting feed source from database:', deleteError);
          throw deleteError;
        }
        
        console.log('Feed source deleted successfully from database');

        // Delete associated documents from vector store
        console.log('Cleaning up vector embeddings for feed source:', sourceId);
        const { error: documentsDeleteError } = await supabase
          .from('documents')
          .delete()
          .eq('metadata->>source_id', sourceId);

        if (documentsDeleteError) {
          console.error('Error deleting documents for feed source:', documentsDeleteError);
          // Don't throw here - the source is already deleted, this is just cleanup
          // We'll log the error but continue
        } else {
          console.log('Vector embeddings cleaned up successfully for feed source');
        }

        return source;
      } catch (error) {
        console.error('Error in feed source deletion process:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('Delete mutation success for feed source');
      // The Realtime subscription will handle updating the cache
    },
  });

  const toggleFavorite = useMutation({
    mutationFn: async (sourceId: string) => {
      // First get the current favorite status
      const { data: currentSource, error: fetchError } = await supabase
        .from('sources')
        .select('is_favorite')
        .eq('id', sourceId)
        .eq('user_id', user?.id)
        .single();

      if (fetchError) throw fetchError;

      // Toggle the favorite status
      const { data, error } = await supabase
        .from('sources')
        .update({ is_favorite: !currentSource.is_favorite })
        .eq('id', sourceId)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      console.log('Feed source favorite status toggled successfully');
      // The Realtime subscription will handle updating the cache
    },
  });

  return {
    sources,
    allSources,
    isLoading,
    error,
    totalCount,
    hasMore,
    loadMore,
    addSource: addSource.mutate,
    addSourceAsync: addSource.mutateAsync,
    isAdding: addSource.isPending,
    updateSource: updateSource.mutate,
    updateSourceAsync: updateSource.mutateAsync,
    isUpdating: updateSource.isPending,
    deleteSource: deleteSource.mutate,
    deleteSourceAsync: deleteSource.mutateAsync,
    isDeleting: deleteSource.isPending,
    toggleFavorite: toggleFavorite.mutate,
    toggleFavoriteAsync: toggleFavorite.mutateAsync,
    isTogglingFavorite: toggleFavorite.isPending,
  };
}; 