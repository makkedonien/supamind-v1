import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PodcastWithCount {
  id: string;
  user_id: string;
  rss_feed: string;
  podcast_name: string;
  image_url: string | null;
  link: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  source_count: number;
}

export const usePodcastsWithCounts = () => {
  const { user } = useAuth();

  const {
    data: podcasts = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['podcasts-with-counts', user?.id],
    queryFn: async (): Promise<PodcastWithCount[]> => {
      if (!user) return [];

      // First get all podcasts
      const { data: podcastsData, error: podcastsError } = await supabase
        .from('podcasts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (podcastsError) throw podcastsError;

      // Then get source counts for each podcast
      const podcastsWithCounts = await Promise.all(
        (podcastsData || []).map(async (podcast) => {
          const { count, error: countError } = await supabase
            .from('sources')
            .select('*', { count: 'exact', head: true })
            .eq('podcast_id', podcast.id)
            .eq('user_id', user.id)
            .eq('type', 'podcast')
            .is('notebook_id', null);

          if (countError) {
            console.error('Error fetching source count for podcast:', podcast.id, countError);
            return { ...podcast, source_count: 0 };
          }

          return { ...podcast, source_count: count || 0 };
        })
      );

      return podcastsWithCounts;
    },
    enabled: !!user,
  });

  return {
    podcasts,
    isLoading,
    error,
  };
};
