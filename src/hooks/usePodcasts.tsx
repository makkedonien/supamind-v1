import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Podcast {
  id: string;
  user_id: string;
  rss_feed: string;
  podcast_name: string;
  image_url: string | null;
  link: string | null;
  description: string | null;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export const usePodcasts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch user's podcasts
  const fetchPodcasts = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('podcasts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching podcasts:', error);
        toast({
          title: "Error",
          description: "Failed to load podcasts.",
          variant: "destructive",
        });
        return;
      }

      setPodcasts(data || []);
    } catch (error) {
      console.error('Error fetching podcasts:', error);
      toast({
        title: "Error",
        description: "Failed to load podcasts.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new podcast feed
  const addPodcast = async (rssUrl: string) => {
    if (!user || !rssUrl.trim()) return false;

    // Check if RSS feed already exists for this user
    const existingPodcast = podcasts.find(p => p.rss_feed === rssUrl.trim());
    if (existingPodcast) {
      toast({
        title: "Podcast already exists",
        description: "This RSS feed has already been added to your podcasts.",
        variant: "destructive",
      });
      return false;
    }

    setIsAdding(true);
    try {
      // Generate a temporary name from URL for immediate display
      let podcastName = 'Processing...';
      try {
        const url = new URL(rssUrl.trim());
        podcastName = url.hostname.replace('www.', '');
      } catch (e) {
        // If URL parsing fails, just use 'Processing...'
        podcastName = 'Processing...';
      }

      // Step 1: Insert podcast with 'processing' status
      const { data, error } = await supabase
        .from('podcasts')
        .insert({
          user_id: user.id,
          rss_feed: rssUrl.trim(),
          podcast_name: podcastName,
          image_url: null,
          link: null,
          description: null,
          status: 'processing',
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding podcast:', error);
        toast({
          title: "Error",
          description: "Failed to add podcast. Please check the RSS URL and try again.",
          variant: "destructive",
        });
        return false;
      }

      // Add to local state immediately with processing status
      setPodcasts(prev => [data, ...prev]);
      
      // Step 2: Call Supabase function to process the RSS feed
      try {
        const { data: functionResult, error: functionError } = await supabase.functions.invoke(
          'process-podcast-feed',
          {
            body: {
              podcastId: data.id,
              userId: user.id,
              rssFeed: rssUrl.trim(),
            },
          }
        );

        console.log('Full function response:', { functionResult, functionError });

        // Check if there's a function call error (network/auth issues)
        if (functionError) {
          console.error('Error calling process-podcast-feed function:', functionError);
          
          // Update local state to show failed status
          setPodcasts(prev => prev.map(p => 
            p.id === data.id ? { ...p, status: 'failed' } : p
          ));
          toast({
            title: "Processing Error",
            description: `Function call failed: ${functionError.message}`,
            variant: "destructive",
          });
        } 
        // Check if the function succeeded but returned an error response
        else if (functionResult && !functionResult.success) {
          console.error('Function returned error:', functionResult);
          
          const errorMessage = functionResult.error || "Podcast added but processing failed. Please try again later.";
          console.log('Extracted error message:', errorMessage);
          
          // Update local state to show failed status
          setPodcasts(prev => prev.map(p => 
            p.id === data.id ? { ...p, status: 'failed' } : p
          ));
          toast({
            title: "Processing Error",
            description: errorMessage,
            variant: "destructive",
          });
        } 
        // Function succeeded
        else {
          console.log('Function success result:', functionResult);
          toast({
            title: "Success",
            description: "Podcast feed added and is being processed!",
          });
        }
      } catch (functionCallError) {
        console.error('Error calling function:', functionCallError);
        console.error('Function call error details:', JSON.stringify(functionCallError, null, 2));
        
        // Update local state to show failed status
        setPodcasts(prev => prev.map(p => 
          p.id === data.id ? { ...p, status: 'failed' } : p
        ));
        toast({
          title: "Processing Error", 
          description: `Function call failed: ${functionCallError.message || 'Unknown error'}`,
          variant: "destructive",
        });
      }

      return true;

    } catch (error) {
      console.error('Error adding podcast:', error);
      toast({
        title: "Error",
        description: "Failed to add podcast. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsAdding(false);
    }
  };

  // Delete a podcast
  const deletePodcast = async (podcastId: string) => {
    if (!user) return false;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('podcasts')
        .delete()
        .eq('id', podcastId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting podcast:', error);
        toast({
          title: "Error",
          description: "Failed to delete podcast.",
          variant: "destructive",
        });
        return false;
      }

      setPodcasts(prev => prev.filter(p => p.id !== podcastId));
      toast({
        title: "Success",
        description: "Podcast removed successfully!",
      });
      return true;

    } catch (error) {
      console.error('Error deleting podcast:', error);
      toast({
        title: "Error",
        description: "Failed to delete podcast.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  // Check if RSS feed already exists
  const rssExists = (rssUrl: string) => {
    return podcasts.some(p => p.rss_feed === rssUrl.trim());
  };

  // Load podcasts when user changes
  useEffect(() => {
    if (user) {
      fetchPodcasts();
    } else {
      setPodcasts([]);
    }
  }, [user]);

  return {
    podcasts,
    isLoading,
    isAdding,
    isDeleting,
    addPodcast,
    deletePodcast,
    rssExists,
    refetch: fetchPodcasts,
  };
};
