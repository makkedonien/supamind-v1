import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Rss, Mic, BookOpen, User, LogOut, Settings, Star, Globe, FileText, Copy, Filter, Loader2, Clock } from 'lucide-react';
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
import Logo from '@/components/ui/Logo';

interface FeedFilters {
  favorites: boolean;
  websites: boolean;
  pdfs: boolean;
  copiedTexts: boolean;
  categories: string[];
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

  const menuItems = [
    {
      icon: Rss,
      label: 'Feed',
      path: '/',
    },
    {
      icon: Mic,
      label: 'Microcasts',
      path: '/microcasts',
    },
    {
      icon: BookOpen,
      label: 'Notebooks',
      path: '/notebooks',
    }
  ];

  // Check if we're on the feed page
  const isFeedPage = location.pathname === '/';
  
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
                  tooltip={user?.email?.split('@')[0] || 'User'}
                >
                  <div className="flex items-center space-x-2 w-full">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex items-center text-left min-w-0 group-data-[collapsible=icon]:hidden">
                      <span className="text-sm font-medium truncate max-w-[140px]">
                        {user?.email?.split('@')[0] || 'User'}
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