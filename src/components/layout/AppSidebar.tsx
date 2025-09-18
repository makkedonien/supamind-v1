import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Rss, Mic, Radio, User, LogOut, Settings, Star, Globe, FileText, Copy, Filter, Loader2, Clock } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useLogout } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import { useUserCategories } from '@/hooks/useUserCategories';
import { useProfile } from '@/hooks/useProfile';
import { usePodcastsWithCounts } from '@/hooks/usePodcastsWithCounts';
import Logo from '@/components/ui/Logo';

interface FeedFilters {
  favorites: boolean;
  websites: boolean;
  pdfs: boolean;
  copiedTexts: boolean;
  categories: string[];
  podcasts: string[];
}

interface AppSidebarProps {
  feedFilters?: FeedFilters;
  onFeedFiltersChange?: (filters: FeedFilters) => void;
  feedSourceCounts?: {
    favorites: number;
    websites: number;
    pdfs: number;
    copiedTexts: number;
    categoryCounts: Record<string, number>;
  };
  processingSources?: {
    id: string;
    title: string;
    processing_status: string;
  }[];
}

const AppSidebar = ({ feedFilters, onFeedFiltersChange, feedSourceCounts, processingSources }: AppSidebarProps = {}) => {
  const location = useLocation();
  const { logout } = useLogout();
  const { user } = useAuth();
  const { categories } = useUserCategories();
  const { profile } = useProfile();
  const { podcasts: podcastsWithCounts } = usePodcastsWithCounts();

  // Get display name with fallback logic
  const getDisplayName = () => {
    if (profile?.full_name) {
      return profile.full_name;
    }
    return user?.email?.split('@')[0] || 'User';
  };

  const menuItems = [
    {
      icon: Rss,
      label: 'Feed',
      path: '/',
    },
    {
      icon: Radio,
      label: 'Podcasts',
      path: '/podcasts',
    },
    {
      icon: Mic,
      label: 'Microcasts',
      path: '/microcasts',
    }
  ];

  // Check if we're on the feed page
  const isFeedPage = location.pathname === '/';
  
  // Check if we're on the podcasts page
  const isPodcastsPage = location.pathname === '/podcasts';
  
  // Filter items for feed page
  const filterItems = feedSourceCounts ? [
    {
      id: 'favorites' as keyof FeedFilters,
      icon: Star,
      label: 'Favorites',
      count: feedSourceCounts.favorites,
      active: feedFilters?.favorites || false,
    },
    {
      id: 'websites' as keyof FeedFilters,
      icon: Globe,
      label: 'Websites',
      count: feedSourceCounts.websites,
      active: feedFilters?.websites || false,
    },
    {
      id: 'pdfs' as keyof FeedFilters,
      icon: FileText,
      label: 'PDFs',
      count: feedSourceCounts.pdfs,
      active: feedFilters?.pdfs || false,
    },
    {
      id: 'copiedTexts' as keyof FeedFilters,
      icon: Copy,
      label: 'Copied Texts',
      count: feedSourceCounts.copiedTexts,
      active: feedFilters?.copiedTexts || false,
    },
  ] : [];

  const handleFilterToggle = (filterId: keyof FeedFilters) => {
    if (!feedFilters || !onFeedFiltersChange || filterId === 'categories') return;
    
    onFeedFiltersChange({
      ...feedFilters,
      [filterId]: !feedFilters[filterId],
    });
  };

  const handleCategoryToggle = (categoryName: string) => {
    if (!feedFilters || !onFeedFiltersChange) return;
    
    const updatedCategories = feedFilters.categories.includes(categoryName)
      ? feedFilters.categories.filter(cat => cat !== categoryName)
      : [...feedFilters.categories, categoryName];
    
    onFeedFiltersChange({
      ...feedFilters,
      categories: updatedCategories,
    });
  };

  const handlePodcastToggle = (podcastId: string) => {
    if (!feedFilters || !onFeedFiltersChange) return;
    
    const updatedPodcasts = feedFilters.podcasts.includes(podcastId)
      ? feedFilters.podcasts.filter(id => id !== podcastId)
      : [...feedFilters.podcasts, podcastId];
    
    onFeedFiltersChange({
      ...feedFilters,
      podcasts: updatedPodcasts,
    });
  };

  // Get categories that actually have feed sources assigned to them
  const categoriesWithSources = categories.filter(category => 
    feedSourceCounts?.categoryCounts[category.name] > 0
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/" className="flex items-center space-x-2 px-2 hover:opacity-80 transition-opacity">
          <Logo size="md" />
          <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">
            Supamind
          </span>
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path || 
                  (item.path !== '/' && location.pathname.startsWith(item.path));
                
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <Link to={item.path}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Filters Section - Only on Feed page */}
        {isFeedPage && feedSourceCounts && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filterItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={item.active}
                      onClick={() => handleFilterToggle(item.id)}
                      tooltip={item.label}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                      {item.count > 0 && (
                        <Badge variant="secondary" className="ml-auto group-data-[collapsible=icon]:hidden">
                          {item.count}
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Categories Section - Only on Feed page */}
        {isFeedPage && categoriesWithSources.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Categories</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {categoriesWithSources.map((category) => {
                  const isActive = feedFilters?.categories.includes(category.name) || false;
                  const count = feedSourceCounts?.categoryCounts[category.name] || 0;
                  
                  return (
                    <SidebarMenuItem key={category.id}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => handleCategoryToggle(category.name)}
                        tooltip={category.name}
                      >
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="truncate">{category.name}</span>
                        {count > 0 && (
                          <Badge variant="secondary" className="ml-auto group-data-[collapsible=icon]:hidden">
                            {count}
                          </Badge>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Podcasts Section - Only on Podcasts page */}
        {isPodcastsPage && podcastsWithCounts && podcastsWithCounts.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <Radio className="h-4 w-4 mr-2" />
              Podcasts
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {podcastsWithCounts.map((podcast) => {
                  const isActive = feedFilters?.podcasts.includes(podcast.id) || false;
                  
                  return (
                    <SidebarMenuItem key={podcast.id}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => handlePodcastToggle(podcast.id)}
                        tooltip={podcast.podcast_name}
                      >
                        {podcast.image_url ? (
                          <img 
                            src={podcast.image_url} 
                            alt={podcast.podcast_name}
                            className="h-4 w-4 rounded object-cover flex-shrink-0"
                            onError={(e) => {
                              // Fallback to Radio icon if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const radioIcon = target.nextElementSibling as HTMLElement;
                              if (radioIcon) radioIcon.style.display = 'block';
                            }}
                          />
                        ) : null}
                        <Radio className={`h-4 w-4 ${podcast.image_url ? 'hidden' : ''}`} />
                        <span className="truncate">{podcast.podcast_name}</span>
                        {podcast.source_count > 0 && (
                          <Badge variant="secondary" className="ml-auto group-data-[collapsible=icon]:hidden">
                            {podcast.source_count}
                          </Badge>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Processing Section - Only on Feed page */}
        {isFeedPage && processingSources && processingSources.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Processing</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {processingSources.map((source) => {
                  const getStatusIcon = () => {
                    switch (source.processing_status) {
                      case 'processing':
                        return <Loader2 className="h-3 w-3 text-blue-600 animate-spin" />;
                      case 'uploading':
                        return <Loader2 className="h-3 w-3 text-blue-600 animate-spin" />;
                      default:
                        return <Clock className="h-3 w-3 text-gray-600" />;
                    }
                  };

                  const getStatusText = () => {
                    switch (source.processing_status) {
                      case 'processing':
                        return 'Processing';
                      case 'uploading':
                        return 'Uploading';
                      default:
                        return 'Pending';
                    }
                  };

                  return (
                    <SidebarMenuItem key={source.id}>
                      <SidebarMenuButton disabled>
                        {getStatusIcon()}
                        <span className="truncate text-sm">{source.title}</span>
                        <Badge variant="outline" className="ml-auto group-data-[collapsible=icon]:hidden text-xs">
                          {getStatusText()}
                        </Badge>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton 
                  className="w-full"
                  tooltip={getDisplayName()}
                >
                  <div className="flex items-center space-x-2 w-full">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-3 w-3 text-primary-foreground" />
                    </div>
                    <div className="flex items-center text-left min-w-0 group-data-[collapsible=icon]:hidden">
                      <span className="text-sm font-medium truncate max-w-[140px]">
                        {getDisplayName()}
                      </span>
                    </div>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="end" className="w-48">
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar; 