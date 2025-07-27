import React from 'react';
import { useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import AppSidebar from './AppSidebar';

interface FeedFilters {
  favorites: boolean;
  websites: boolean;
  pdfs: boolean;
  copiedTexts: boolean;
  categories: string[];
}

interface AppLayoutProps {
  children: React.ReactNode;
  feedFilters?: FeedFilters;
  onFeedFiltersChange?: (filters: FeedFilters) => void;
  feedSourceCounts?: {
    favorites: number;
    websites: number;
    pdfs: number;
    copiedTexts: number;
    categoryCounts: Record<string, number>;
  };
}

const AppLayout = ({ children, feedFilters, onFeedFiltersChange, feedSourceCounts }: AppLayoutProps) => {
  const location = useLocation();
  
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Feed';
      case '/microcasts':
        return 'Microcasts';
      case '/notebooks':
        return 'Notebooks';
      case '/settings':
        return 'Settings';
      default:
        return '';
    }
  };

  return (
    <SidebarProvider 
      style={{
        "--sidebar-width": "14rem",
        "--sidebar-width-mobile": "16rem",
      } as React.CSSProperties}
    >
      <AppSidebar 
        feedFilters={feedFilters}
        onFeedFiltersChange={onFeedFiltersChange}
        feedSourceCounts={feedSourceCounts}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background sticky top-0 z-10">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-sm font-medium" style={{ fontSize: '14px' }}>
            {getPageTitle()}
          </span>
        </header>
        <div className="flex-1 space-y-4 p-4 md:p-8 min-h-[calc(100vh-4rem)]">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AppLayout;