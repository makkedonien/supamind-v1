import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import { ExternalLink, LayoutGrid, List, Check, X, Share, Bookmark, Star, Clock, Calendar, Plus, Bot, Tag } from 'lucide-react';
import { useFeedSources } from '@/hooks/useFeedSources';
import { useToast } from '@/hooks/use-toast';
import FeedSourceCard from '@/components/feed/FeedSourceCard';
import AddFeedSourceDialog from '@/components/feed/AddFeedSourceDialog';
import SourceCategoryDialog from '@/components/feed/SourceCategoryDialog';
import AppLayout from '@/components/layout/AppLayout';


// Enhanced Types
interface ContentItem {
  id: string;
  title: string;
  description: string;
  image: string;
  domain: string;
  favicon?: string;
  categories: string[];
  url: string;
  publishedAt?: string;
  readTime?: number;
  summary?: string;
  deep_summary?: string;
  is_favorite?: boolean;
}

interface FeedFilters {
  favorites: boolean;
  websites: boolean;
  pdfs: boolean;
  copiedTexts: boolean;
  categories: string[];
}

// Updated placeholder data
const placeholderItems: ContentItem[] = [
  {
    id: "1",
    title: "AI Research Breakthrough",
    description: "Revolutionary AI breakthrough enables real-time language translation with 99% accuracy across 50+ languages, promising to transform global communication and break down language barriers worldwide.",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop",
    domain: "techcrunch.com",
    categories: ["AI", "Technology", "Translation"],
    url: "https://techcrunch.com/example",
    publishedAt: "2h ago",
    readTime: 5
  },
  {
    id: "2", 
    title: "Renewable Energy Investment",
    description: "Global markets surge as renewable energy investments reach record $2.8 trillion milestone this quarter, signaling unprecedented shift toward sustainable infrastructure and clean technology adoption.",
    image: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400&h=300&fit=crop",
    domain: "reuters.com",
    categories: ["Finance", "Renewable", "Markets"],
    url: "https://reuters.com/example",
    publishedAt: "4h ago",
    readTime: 3
  }
];

// Detail View Components
const DetailView: React.FC<{ 
  item: ContentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onCategorize?: (item: ContentItem) => void;
}> = ({ item, isOpen, onClose, onCategorize }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (!item) return null;

  // Mobile: Full screen dialog
  if (isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-full h-[100dvh] m-0 p-0 flex flex-col">
          <DetailContent item={item} onClose={onClose} onCategorize={onCategorize} isMobile={true} />
        </DialogContent>
      </Dialog>
    );
  }

  // Desktop: Right sidebar sheet
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="p-0"
        style={{ width: '800px', maxWidth: '90vw' }}
      >
        <DetailContent item={item} onClose={onClose} onCategorize={onCategorize} isMobile={false} />
      </SheetContent>
    </Sheet>
  );
};

const DetailContent: React.FC<{
  item: ContentItem;
  onClose: () => void;
  onCategorize?: (item: ContentItem) => void;
  isMobile?: boolean;
}> = ({ item, onClose, onCategorize, isMobile = false }) => {
  const { toggleFavoriteAsync, isTogglingFavorite } = useFeedSources();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(item.is_favorite || false);

  // Sync local state when item changes
  useEffect(() => {
    setIsFavorite(item.is_favorite || false);
  }, [item.id, item.is_favorite]);

  const handleToggleFavorite = async () => {
    try {
      await toggleFavoriteAsync(item.id);
      // Update local state immediately for instant feedback
      setIsFavorite(!isFavorite);
      toast({
        title: isFavorite ? "Removed from favorites" : "Added to favorites",
        description: `"${item.title}" has been ${isFavorite ? 'removed from' : 'added to'} your favorites.`,
      });
    } catch (error) {
      console.error('Error toggling favorite status:', error);
      toast({
        title: "Error",
        description: "Failed to update favorite status. Please try again.",
        variant: "destructive",
      });
    }
  };
  return (
    <div className={`flex flex-col ${isMobile ? 'min-h-full' : 'h-full'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={item.favicon} />
            <AvatarFallback>{item.domain[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-lg">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.domain}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            className="hover:bg-transparent shadow-none hover:shadow-none"
            onClick={handleToggleFavorite}
            disabled={isTogglingFavorite}
          >
            <Star className={`h-4 w-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
          </Button>
          {onCategorize && (
            <Button 
              variant="ghost" 
              size="icon"
              className="hover:bg-transparent shadow-none hover:shadow-none"
              onClick={() => onCategorize(item)}
            >
              <Tag className="h-4 w-4 text-gray-600" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

            {/* Content */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6">
          {/* Featured Image */}
          <div className="aspect-video rounded-lg overflow-hidden">
            <img 
              src={item.image} 
              alt={item.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{item.publishedAt || "2 hours ago"}</span>
            </div>
            {item.categories && item.categories.length > 0 && (
              <>
                <span>•</span>
                <div className="flex flex-wrap gap-1">
                  {item.categories.map(category => (
                    <Badge key={category} variant="secondary" className="text-xs px-1.5 py-0.5">
                      {category}
                    </Badge>
                  ))}
                </div>
              </>
            )}
          </div>

          <Separator />

          {/* Content */}
          <div className="prose prose-sm max-w-none">
            {item.summary && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900 m-0">Summary</h3>
                </div>
                <div className="text-base leading-relaxed">
                  {item.summary}
                </div>
              </div>
            )}
            
            {item.deep_summary && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900 m-0">Deep Dive</h3>
                </div>
                <div className="text-base leading-relaxed">
                  {item.deep_summary}
                </div>
              </div>
            )}
            
            {!item.summary && !item.deep_summary && (
              <div className="text-base leading-relaxed mb-6">
                {item.description}
              </div>
            )}
            
            {/* Show placeholder content for actual feed sources since they contain real content */}
            {(item.summary || item.description !== 'No description available') && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2 text-blue-900">📄 Source Content</h3>
                  <p className="text-blue-800 text-sm">
                    This source has been processed and added to your knowledge base. You can use it in your notebooks for chat and analysis.
                  </p>
                </div>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">💡 How to Use</h3>
                  <ul className="text-gray-700 text-sm space-y-1">
                    <li>• Create a notebook and add this source to start chatting with the content</li>
                    <li>• Use the original link below to view the full source material</li>
                    <li>• Organize sources with categories for better discovery</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="border-t p-4 bg-muted/30">
        <div className="flex gap-3">
          <Button className="flex-1" onClick={() => window.open(item.url, '_blank')}>
            <ExternalLink className="h-4 w-4 mr-2" />
            View Original
          </Button>
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add to Notebook
          </Button>
        </div>
      </div>
    </div>
  );
};

// Enhanced List View Item Component
const ListViewItem: React.FC<{ 
  item: ContentItem;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  onOpenDetail: (item: ContentItem) => void;
}> = ({ item, isSelected, onToggleSelection, onOpenDetail }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card 
      className={`overflow-hidden transition-all duration-200 w-full cursor-pointer ${
        isSelected 
          ? 'ring-2 ring-primary bg-primary/5 shadow-lg' 
          : 'hover:shadow-lg'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpenDetail(item)}
    >
      <div className="flex relative">
        {/* Hover Actions - Top Left */}
        <div className={`absolute top-3 left-3 z-10 flex gap-2 transition-opacity duration-200 ${
          isHovered || isSelected ? 'opacity-100' : 'opacity-0'
        }`}>
          {/* Selection Checkbox */}
          <Button
            variant={isSelected ? "default" : "secondary"}
            size="icon"
            className={`h-8 w-8 shadow-sm ${
              isSelected 
                ? 'bg-primary hover:bg-primary/90' 
                : 'bg-white/90 hover:bg-white'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelection(item.id);
            }}
          >
            {isSelected ? (
              <Check className="h-4 w-4 text-white" />
            ) : (
              <div className="h-4 w-4 border border-current rounded-sm" />
            )}
          </Button>
        </div>

        {/* Left Side - Image */}
        <div className="relative flex-shrink-0 w-48">
          <img 
            src={item.image} 
            alt={item.title}
            className="w-full h-32 object-cover"
          />
        </div>
        
        {/* Right Side - Content */}
        <CardContent className="flex-1 p-4 flex flex-col justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-base text-foreground mb-2 line-clamp-2">
              {item.title}
            </h3>
            <CardDescription className="line-clamp-3 mb-3 text-sm">
              {item.description}
            </CardDescription>
            
            <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
              <Avatar className="h-4 w-4">
                <AvatarImage src={item.favicon} />
                <AvatarFallback>{item.domain[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <span>{item.domain}</span>
              
              <span>•</span>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(item.url, '_blank');
                }}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Link to original
              </Button>
              
              <span>•</span>
              
              <div className="flex flex-wrap gap-1">
                {item.categories.map(category => (
                  <Badge key={category} variant="secondary" className="text-xs">
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

// Enhanced Card View Item Component
const CardViewItem: React.FC<{ 
  item: ContentItem;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  onOpenDetail: (item: ContentItem) => void;
}> = ({ item, isSelected, onToggleSelection, onOpenDetail }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card 
      className={`overflow-hidden transition-all duration-200 group cursor-pointer ${
        isSelected 
          ? 'ring-2 ring-primary bg-primary/5 shadow-lg' 
          : 'hover:shadow-lg'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpenDetail(item)}
    >
      {/* Top - Image */}
      <div className="relative">
        <img 
          src={item.image} 
          alt={item.title}
          className="w-full h-40 object-cover"
        />

        {/* Hover Actions - Top Left */}
        <div className={`absolute top-2 left-2 flex gap-1 transition-opacity duration-200 ${
          isHovered || isSelected ? 'opacity-100' : 'opacity-0'
        }`}>
          {/* Selection Checkbox */}
          <Button
            variant={isSelected ? "default" : "secondary"}
            size="icon"
            className={`h-7 w-7 shadow-sm ${
              isSelected 
                ? 'bg-primary hover:bg-primary/90' 
                : 'bg-white/90 hover:bg-white'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelection(item.id);
            }}
          >
            {isSelected ? (
              <Check className="h-3.5 w-3.5 text-white" />
            ) : (
              <div className="h-3.5 w-3.5 border border-current rounded-sm" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Bottom - Content */}
      <CardContent className="p-4">
        <h3 className="font-semibold text-base text-foreground mb-3 line-clamp-2">
          {item.title}
        </h3>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Avatar className="h-3 w-3">
            <AvatarImage src={item.favicon} />
            <AvatarFallback>{item.domain[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="truncate">{item.domain}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              window.open(item.url, '_blank');
            }}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Link to original
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-1">
          {item.categories.map(category => (
            <Badge key={category} variant="secondary" className="text-xs px-1.5 py-0.5">
              {category}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Enhanced Main Content Feed Item Component
const ContentFeedItem: React.FC<{ 
  item: ContentItem; 
  viewMode: 'list' | 'card';
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  onOpenDetail: (item: ContentItem) => void;
}> = ({ item, viewMode, isSelected, onToggleSelection, onOpenDetail }) => {
  if (viewMode === 'list') {
    return (
      <ListViewItem 
        item={item} 
        isSelected={isSelected}
        onToggleSelection={onToggleSelection}
        onOpenDetail={onOpenDetail}
      />
    );
  }
  return (
    <CardViewItem 
      item={item} 
      isSelected={isSelected}
      onToggleSelection={onToggleSelection}
      onOpenDetail={onOpenDetail}
    />
  );
};

// Enhanced Main Feed Component
const Feed = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [isMobile, setIsMobile] = useState(false);
  
  // Feed sources state
  const [showAddSourceDialog, setShowAddSourceDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [selectedSourceForCategory, setSelectedSourceForCategory] = useState<any>(null);
  const [selectedSourceForEdit, setSelectedSourceForEdit] = useState<any>(null);
  
  // New state for hover interactions (keeping for future detail view)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [detailItem, setDetailItem] = useState<ContentItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Feed source selection state
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());

  // Optimistic deletion state
  const [optimisticallyDeletedIds, setOptimisticallyDeletedIds] = useState<Set<string>>(new Set());

  // Feed sources data
  const { sources, isLoading, error } = useFeedSources();

  // Auto-cleanup optimistically deleted items when they're actually removed from sources
  useEffect(() => {
    if (sources && optimisticallyDeletedIds.size > 0) {
      const sourceIds = new Set(sources.map(source => source.id));
      const idsToRemove = Array.from(optimisticallyDeletedIds).filter(id => !sourceIds.has(id));
      
      if (idsToRemove.length > 0) {
        setOptimisticallyDeletedIds(prev => {
          const newSet = new Set(prev);
          idsToRemove.forEach(id => newSet.delete(id));
          return newSet;
        });
      }
    }
  }, [sources, optimisticallyDeletedIds]);

  // Filter state
  const [filters, setFilters] = useState<FeedFilters>({
    favorites: false,
    websites: false,
    pdfs: false,
    copiedTexts: false,
    categories: [],
  });

  // Filtered sources based on active filters
  const filteredSources = useMemo(() => {
    if (!sources) return [];

    return sources.filter(source => {
      // Exclude optimistically deleted items
      if (optimisticallyDeletedIds.has(source.id)) return false;

      // If no filters are active, show all sources
      const hasActiveFilters = filters.favorites || filters.websites || filters.pdfs || filters.copiedTexts || filters.categories.length > 0;
      if (!hasActiveFilters) return true;

      // Check favorites filter
      if (filters.favorites && !source.is_favorite) return false;

      // Check type filters
      if (filters.websites && !['website', 'youtube'].includes(source.type)) return false;
      if (filters.pdfs && source.type !== 'pdf') return false;
      if (filters.copiedTexts && source.type !== 'text') return false;

      // Check category filters
      if (filters.categories.length > 0) {
        const sourceCategories = source.category || [];
        const hasMatchingCategory = filters.categories.some(filterCategory => 
          sourceCategories.includes(filterCategory)
        );
        if (!hasMatchingCategory) return false;
      }

      return true;
    });
  }, [sources, filters, optimisticallyDeletedIds]);

  // Calculate source counts for sidebar
  const sourceCounts = useMemo(() => {
    if (!sources) {
      return {
        favorites: 0,
        websites: 0,
        pdfs: 0,
        copiedTexts: 0,
        categoryCounts: {},
      };
    }

    const counts = {
      favorites: sources.filter(s => s.is_favorite).length,
      websites: sources.filter(s => ['website', 'youtube'].includes(s.type)).length,
      pdfs: sources.filter(s => s.type === 'pdf').length,
      copiedTexts: sources.filter(s => s.type === 'text').length,
      categoryCounts: {} as Record<string, number>,
    };

    // Calculate category counts
    sources.forEach(source => {
      const sourceCategories = source.category || [];
      sourceCategories.forEach(category => {
        counts.categoryCounts[category] = (counts.categoryCounts[category] || 0) + 1;
      });
    });

    return counts;
  }, [sources]);

  // Mobile detection
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);
      // Force card view on mobile
      if (mobile) {
        setViewMode('card');
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Load saved view preference (only on desktop)
  useEffect(() => {
    if (!isMobile) {
      const savedView = localStorage.getItem('feedViewMode');
      if (savedView === 'list' || savedView === 'card') {
        setViewMode(savedView);
      }
    }
  }, [isMobile]);

  // Save view preference (only on desktop)
  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('feedViewMode', viewMode);
    }
  }, [viewMode, isMobile]);

  // New handlers for hover interactions
  const handleToggleSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(itemId)) {
        newSelected.delete(itemId);
      } else {
        newSelected.add(itemId);
      }
      return newSelected;
    });
  };

  const handleOpenDetail = (item: ContentItem) => {
    setDetailItem(item);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setDetailItem(null);
  };

  // Feed source handlers
  const handleEditSource = (source: any) => {
    setSelectedSourceForEdit(source);
    // For now, just show a placeholder - could implement title editing
    console.log('Edit source:', source);
  };

  const handleCategorizeSource = (source: any) => {
    setSelectedSourceForCategory(source);
    setShowCategoryDialog(true);
  };

  const handleCategorizeContentItem = (item: ContentItem) => {
    // Find the original source by ID to ensure we have all the necessary data
    const originalSource = sources.find(source => source.id === item.id);
    if (originalSource) {
      setSelectedSourceForCategory(originalSource);
      setShowCategoryDialog(true);
    }
  };

  const handleCloseCategoryDialog = () => {
    setShowCategoryDialog(false);
    setSelectedSourceForCategory(null);
  };

  // Optimistic deletion handlers
  const handleOptimisticDelete = (sourceId: string) => {
    setOptimisticallyDeletedIds(prev => new Set(prev).add(sourceId));
  };



  const handleDeleteError = (sourceId: string) => {
    // Roll back optimistic deletion on error
    setOptimisticallyDeletedIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(sourceId);
      return newSet;
    });
  };

  // Convert FeedSource to ContentItem for detail view
  const convertFeedSourceToContentItem = (source: any): ContentItem => {
    const getDomain = (url: string) => {
      try {
        return new URL(url).hostname.replace('www.', '');
      } catch {
        return 'Unknown';
      }
    };

    return {
      id: source.id,
      title: source.title,
      description: source.short_description || source.summary || source.content || 'No description available',
      image: source.image_url || '/placeholder.svg',
      domain: source.url ? getDomain(source.url) : source.type,
      favicon: source.url ? `https://www.google.com/s2/favicons?domain=${getDomain(source.url)}&sz=32` : undefined,
      categories: source.category || [],
      url: source.url || '#',
      publishedAt: source.created_at ? new Date(source.created_at).toLocaleDateString() : undefined,
      readTime: 5, // Default read time, could be calculated based on content length
      summary: source.summary,
      deep_summary: source.deep_summary,
      is_favorite: source.is_favorite
    };
  };

  // Handle opening detail view for feed source
  const handleOpenFeedSourceDetail = (source: any) => {
    const contentItem = convertFeedSourceToContentItem(source);
    setDetailItem(contentItem);
    setIsDetailOpen(true);
  };

  // Feed source selection handlers
  const handleSourceSelection = (sourceId: string, selected: boolean) => {
    setSelectedSources(prev => {
      const newSelected = new Set(prev);
      if (selected) {
        newSelected.add(sourceId);
      } else {
        newSelected.delete(sourceId);
      }
      return newSelected;
    });
  };

  return (
    <AppLayout 
      feedFilters={filters}
      onFeedFiltersChange={setFilters}
      feedSourceCounts={sourceCounts}
    >
      <main className="w-full px-6 py-8 2xl:max-w-[1480px] 2xl:mx-auto">
          {/* Content Feed Section */}
          <div className="space-y-6">
        {/* Header with Add Source Button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Your Feed</h2>
            <p className="text-sm text-gray-600 mt-1">
              {selectedSources.size > 0 ? (
                <>
                  {selectedSources.size} source{selectedSources.size !== 1 ? 's' : ''} selected
                  <span className="mx-2">•</span>
                  {filteredSources?.length || 0} filtered
                  <span className="mx-2">•</span>
                  {sources?.length || 0} total
                </>
              ) : (
                <>
                  {filteredSources?.length || 0} source{filteredSources?.length !== 1 ? 's' : ''} 
                  {(filters.favorites || filters.websites || filters.pdfs || filters.copiedTexts || filters.categories.length > 0) ? ' match filters' : ' in your feed'}
                  {(filters.favorites || filters.websites || filters.pdfs || filters.copiedTexts || filters.categories.length > 0) && (
                    <>
                      <span className="mx-2">•</span>
                      {sources?.length || 0} total
                    </>
                  )}
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedSources.size > 0 && (
              <Button 
                variant="outline" 
                onClick={() => setSelectedSources(new Set())}
              >
                Clear Selection
              </Button>
            )}
            <Button onClick={() => setShowAddSourceDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Source
            </Button>
            {!isMobile && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">View:</span>
                <div className="flex border rounded-md p-1 bg-muted/50">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8 px-3"
                  >
                    <List className="h-4 w-4 mr-1" />
                    List
                  </Button>
                  <Button
                    variant={viewMode === 'card' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('card')}
                    className="h-8 px-3"
                  >
                    <LayoutGrid className="h-4 w-4 mr-1" />
                    Cards
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-600">Loading your feed sources...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <p className="text-sm text-red-600">Error loading feed sources. Please try again.</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && (!sources || sources.length === 0) && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-gray-400 text-2xl">📄</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sources in your feed yet</h3>
            <p className="text-sm text-gray-600 mb-4">
              Add PDFs, articles, websites, or text content to start building your personal knowledge feed.
            </p>
            <Button onClick={() => setShowAddSourceDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Source
            </Button>
          </div>
        )}

        {/* No Filtered Results State */}
        {!isLoading && !error && sources && sources.length > 0 && filteredSources.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-gray-400 text-2xl">🔍</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sources match your filters</h3>
            <p className="text-sm text-gray-600 mb-4">
              Try adjusting your filters to see more sources.
            </p>
            <Button 
              variant="outline" 
              onClick={() => setFilters({ favorites: false, websites: false, pdfs: false, copiedTexts: false, categories: [] })}
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Feed Sources Grid */}
        {!isLoading && !error && sources && sources.length > 0 && filteredSources.length > 0 && (
          <div className={viewMode === 'list' 
            ? "space-y-4 w-full" 
            : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          }>
            {filteredSources.map(source => (
              <FeedSourceCard 
                key={source.id} 
                source={source}
                viewMode={viewMode}
                onEdit={handleEditSource}
                onCategorize={handleCategorizeSource}
                onOpenDetail={handleOpenFeedSourceDetail}
                isSelected={selectedSources.has(source.id)}
                onSelectionChange={handleSourceSelection}
                onOptimisticDelete={handleOptimisticDelete}
                onDeleteError={handleDeleteError}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail View - Keep for future enhancement */}
      <DetailView
        item={detailItem}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        onCategorize={handleCategorizeContentItem}
      />

      {/* Feed Source Dialogs */}
      <AddFeedSourceDialog 
        open={showAddSourceDialog} 
        onOpenChange={setShowAddSourceDialog} 
      />

      <SourceCategoryDialog 
        open={showCategoryDialog} 
        onOpenChange={handleCloseCategoryDialog} 
        source={selectedSourceForCategory}
      />
      </main>
    </AppLayout>
  );
};

export default Feed;