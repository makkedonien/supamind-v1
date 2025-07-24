import React, { useState, useEffect } from 'react';
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
import { ExternalLink, LayoutGrid, List, Check, X, Share, Bookmark, Star, Clock, Calendar, Plus } from 'lucide-react';
import { useFeedSources } from '@/hooks/useFeedSources';
import FeedSourceCard from '@/components/feed/FeedSourceCard';
import AddFeedSourceDialog from '@/components/feed/AddFeedSourceDialog';
import SourceCategoryDialog from '@/components/feed/SourceCategoryDialog';

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
}> = ({ item, isOpen, onClose }) => {
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
        <DialogContent className="max-w-full max-h-full m-0 p-0">
          <DetailContent item={item} onClose={onClose} />
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
        <DetailContent item={item} onClose={onClose} />
      </SheetContent>
    </Sheet>
  );
};

const DetailContent: React.FC<{
  item: ContentItem;
  onClose: () => void;
}> = ({ item, onClose }) => {
  return (
    <div className="flex flex-col h-full">
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
          <Button variant="outline" size="icon">
            <Share className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Bookmark className="h-4 w-4" />
          </Button>
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
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{item.publishedAt || "2 hours ago"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{item.readTime || 5} min read</span>
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {item.categories.map(category => (
              <Badge key={category} variant="default">
                {category}
              </Badge>
            ))}
          </div>

          <Separator />

          {/* Article Content */}
          <div className="prose prose-sm max-w-none">
            <p className="text-base leading-relaxed mb-4">
              {item.description}
            </p>
            
            <h3 className="text-lg font-semibold mb-3">Key Highlights</h3>
            <p className="mb-4">
              This development represents a significant advancement with widespread implications. 
              Industry experts consider this a pivotal moment that could reshape the landscape.
            </p>

            <h3 className="text-lg font-semibold mb-3">Technical Overview</h3>
            <p className="mb-4">
              The implementation uses cutting-edge methodologies and advanced algorithms to achieve 
              unprecedented accuracy. The system architecture prioritizes scalability and reliability.
            </p>

            <h3 className="text-lg font-semibold mb-3">Market Impact</h3>
            <p className="mb-4">
              Early indicators show positive market reception with analysts projecting significant 
              growth potential. This addresses longstanding challenges while opening new possibilities.
            </p>
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
          <Button variant="outline" size="icon">
            <Star className="h-4 w-4" />
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

  // Feed sources data
  const { sources, isLoading, error } = useFeedSources();

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

  const handleCloseCategoryDialog = () => {
    setShowCategoryDialog(false);
    setSelectedSourceForCategory(null);
  };

  return (
    <main className="w-full px-6 py-8 2xl:max-w-[1480px] 2xl:mx-auto">
      {/* Content Feed Section */}
      <div className="space-y-6">
        {/* Header with Add Source Button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Your Feed</h2>
            <p className="text-sm text-gray-600 mt-1">
              {sources?.length || 0} source{sources?.length !== 1 ? 's' : ''} in your feed
            </p>
          </div>
          <div className="flex items-center gap-3">
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

        {/* Feed Sources Grid */}
        {!isLoading && !error && sources && sources.length > 0 && (
          <div className={viewMode === 'list' 
            ? "space-y-4 w-full" 
            : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          }>
            {sources.map(source => (
              <FeedSourceCard 
                key={source.id} 
                source={source}
                onEdit={handleEditSource}
                onCategorize={handleCategorizeSource}
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
  );
};

export default Feed;