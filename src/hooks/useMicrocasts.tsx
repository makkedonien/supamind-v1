import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Microcast = Tables<'microcasts'>;
type MicrocastInsert = TablesInsert<'microcasts'>;
type MicrocastUpdate = TablesUpdate<'microcasts'>;

export const useMicrocasts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: microcasts = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['microcasts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('microcasts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Set up Realtime subscription for microcasts
  useEffect(() => {
    if (!user) return;

    console.log('Setting up Realtime subscription for microcasts, user:', user.id);

    const channel = supabase
      .channel('microcasts-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'microcasts',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          console.log('Realtime: Microcasts change received:', payload);
          
          // Update the query cache based on the event type
          queryClient.setQueryData(['microcasts', user.id], (oldMicrocasts: Microcast[] = []) => {
            switch (payload.eventType) {
              case 'INSERT':
                const newMicrocast = payload.new as Microcast;
                const existsInsert = oldMicrocasts.some(microcast => microcast.id === newMicrocast?.id);
                if (existsInsert) {
                  console.log('Microcast already exists, skipping INSERT:', newMicrocast?.id);
                  return oldMicrocasts;
                }
                console.log('Adding new microcast to cache:', newMicrocast);
                return [newMicrocast, ...oldMicrocasts];
                
              case 'UPDATE':
                const updatedMicrocast = payload.new as Microcast;
                console.log('Updating microcast in cache:', updatedMicrocast?.id);
                return oldMicrocasts.map(microcast => 
                  microcast.id === updatedMicrocast?.id ? updatedMicrocast : microcast
                );
                
              case 'DELETE':
                const deletedMicrocast = payload.old as Microcast;
                console.log('Removing microcast from cache:', deletedMicrocast?.id);
                return oldMicrocasts.filter(microcast => microcast.id !== deletedMicrocast?.id);
                
              default:
                console.log('Unknown event type:', payload.eventType);
                return oldMicrocasts;
            }
          });
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status for microcasts:', status);
      });

    return () => {
      console.log('Cleaning up Realtime subscription for microcasts');
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const createMicrocast = useMutation({
    mutationFn: async (microcastData: {
      sourceIds: string[];
    }) => {
      if (!user) throw new Error('User not authenticated');

      // First create the microcast record with a temporary title
      const { data, error } = await supabase
        .from('microcasts')
        .insert({
          user_id: user.id,
          title: 'Generating title...', // Temporary title until N8N generates the real one
          source_ids: microcastData.sourceIds,
          generation_status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Then trigger the generation process
      const { error: generationError } = await supabase.functions.invoke('generate-microcast', {
        body: {
          microcastId: data.id,
          sourceIds: microcastData.sourceIds,
        },
      });

      if (generationError) {
        console.error('Error starting microcast generation:', generationError);
        // Update status to failed
        await supabase
          .from('microcasts')
          .update({ generation_status: 'failed' })
          .eq('id', data.id);
        throw generationError;
      }

      return data;
    },
    onSuccess: (newMicrocast) => {
      console.log('Microcast created successfully:', newMicrocast);
      // The Realtime subscription will handle updating the cache
    },
  });

  const updateMicrocast = useMutation({
    mutationFn: async ({ microcastId, updates }: { 
      microcastId: string; 
      updates: MicrocastUpdate;
    }) => {
      const { data, error } = await supabase
        .from('microcasts')
        .update(updates)
        .eq('id', microcastId)
        .eq('user_id', user?.id) // Ensure user can only update their own microcasts
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      console.log('Microcast updated successfully');
      // The Realtime subscription will handle updating the cache
    },
  });

  const deleteMicrocast = useMutation({
    mutationFn: async (microcastId: string) => {
      console.log('Starting microcast deletion process for:', microcastId);
      
      try {
        // First, get the microcast details
        const { data: microcast, error: fetchError } = await supabase
          .from('microcasts')
          .select('id, title, audio_url')
          .eq('id', microcastId)
          .eq('user_id', user?.id) // Ensure user can only delete their own microcasts
          .single();

        if (fetchError) {
          console.error('Error fetching microcast:', fetchError);
          throw new Error('Failed to find microcast');
        }

        console.log('Found microcast to delete:', microcast.title);

        // Delete the audio files from storage if they exist
        if (microcast.audio_url) {
          console.log('Deleting audio files from storage for microcast:', microcastId);
          
          try {
            // List all files in the microcast folder
            const { data: files, error: listError } = await supabase.storage
              .from('audio')
              .list(`microcasts/${microcastId}`);

            if (listError) {
              console.error('Error listing microcast files:', listError);
            } else if (files && files.length > 0) {
              // Delete all files in the folder
              const filePaths = files.map(file => `microcasts/${microcastId}/${file.name}`);
              console.log('Deleting files:', filePaths);
              
              const { error: deleteError } = await supabase.storage
                .from('audio')
                .remove(filePaths);

              if (deleteError) {
                console.error('Error deleting files from storage:', deleteError);
              } else {
                console.log('Successfully deleted files from storage');
              }
            }
          } catch (storageError) {
            console.error('Storage operation failed:', storageError);
            // Continue with database deletion even if storage deletion fails
          }
        }

        // Delete the microcast record from the database
        const { error: deleteError } = await supabase
          .from('microcasts')
          .delete()
          .eq('id', microcastId)
          .eq('user_id', user?.id); // Ensure user can only delete their own microcasts

        if (deleteError) {
          console.error('Error deleting microcast from database:', deleteError);
          throw deleteError;
        }
        
        console.log('Microcast deleted successfully from database');
        return microcast;
      } catch (error) {
        console.error('Error in microcast deletion process:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('Delete mutation success for microcast');
      // The Realtime subscription will handle updating the cache
    },
  });

  const refreshAudioUrl = useMutation({
    mutationFn: async (microcastId: string) => {
      const { data, error } = await supabase.functions.invoke('refresh-audio-url', {
        body: { microcastId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      console.log('Microcast audio URL refreshed successfully');
      // The Realtime subscription will handle updating the cache
    },
  });

  return {
    microcasts,
    isLoading,
    error,
    createMicrocast: createMicrocast.mutate,
    createMicrocastAsync: createMicrocast.mutateAsync,
    isCreating: createMicrocast.isPending,
    updateMicrocast: updateMicrocast.mutate,
    updateMicrocastAsync: updateMicrocast.mutateAsync,
    isUpdating: updateMicrocast.isPending,
    deleteMicrocast: deleteMicrocast.mutate,
    deleteMicrocastAsync: deleteMicrocast.mutateAsync,
    isDeleting: deleteMicrocast.isPending,
    refreshAudioUrl: refreshAudioUrl.mutate,
    refreshAudioUrlAsync: refreshAudioUrl.mutateAsync,
    isRefreshing: refreshAudioUrl.isPending,
  };
};