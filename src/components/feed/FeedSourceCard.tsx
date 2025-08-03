import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ExternalLink, Tag, FileText, Link as LinkIcon, Youtube, Volume2, Clock, CheckCircle, XCircle, Loader2, Star, Trash2, Check } from 'lucide-react';
import { useFeedSources } from '@/hooks/useFeedSources';
import { useToast } from '@/hooks/use-toast';

interface FeedSource {
  id: string;
  title: string;
  type: 'pdf' | 'text' | 'website' | 'youtube' | 'audio';
  url?: string;
  file_path?: string;
  content?: string;
  summary?: string;
  short_description?: string;
  deep_summary?: string;
  publisher_name?: string;
  category?: string[];
  processing_status?: string;
  metadata?: any;
  image_url?: string;
  is_favorite?: boolean;
  created_at: string;
  updated_at: string;
}

interface FeedSourceCardProps {
  source: FeedSource;
  onEdit?: (source: FeedSource) => void;
  onCategorize?: (source: FeedSource) => void;
  onOpenDetail?: (source: FeedSource) => void;
  viewMode?: 'list' | 'card';
  isSelected?: boolean;
  onSelectionChange?: (sourceId: string, selected: boolean) => void;
  onOptimisticDelete?: (sourceId: string) => void;
  onDeleteError?: (sourceId: string) => void;
}

const FeedSourceCard = ({ source, onEdit, onCategorize, onOpenDetail, viewMode = 'card', isSelected = false, onSelectionChange, onOptimisticDelete, onDeleteError }: FeedSourceCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showStatus, setShowStatus] = useState(true);
  const [statusOpacity, setStatusOpacity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(source.is_favorite || false);

  const { deleteSourceAsync, toggleFavoriteAsync, isTogglingFavorite } = useFeedSources();
  const { toast } = useToast();

  // Sync local state when source changes
  useEffect(() => {
    setIsFavorite(source.is_favorite || false);
  }, [source.id, source.is_favorite]);

  // Handle status visibility and fade-out animation
  useEffect(() => {
    if (source.processing_status === 'completed') {
      // Start fade out animation after a brief delay
      const timer = setTimeout(() => {
        setStatusOpacity(0);
        // Hide completely after fade animation completes
        setTimeout(() => setShowStatus(false), 2000);
      }, 500);
      
      return () => clearTimeout(timer);
    } else if (source.processing_status === 'processing' || source.processing_status === 'uploading') {
      setShowStatus(true);
      setStatusOpacity(1);
    }
  }, [source.processing_status]);

  const getSourceIcon = () => {
    switch (source.type) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-600" />;
      case 'website':
        return <LinkIcon className="h-4 w-4 text-green-600" />;
      case 'youtube':
        return <Youtube className="h-4 w-4 text-red-600" />;
      case 'audio':
        return <Volume2 className="h-4 w-4 text-purple-600" />;
      case 'text':
        return <FileText className="h-4 w-4 text-blue-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusIcon = () => {
    switch (source.processing_status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'processing':
      case 'uploading':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusText = () => {
    switch (source.processing_status) {
      case 'completed':
        return 'Ready';
      case 'failed':
        return 'Failed';
      case 'processing':
        return 'Processing';
      case 'uploading':
        return 'Uploading';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  const shouldShowStatus = () => {
    return showStatus && (source.processing_status === 'processing' || source.processing_status === 'uploading' || source.processing_status === 'completed');
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const getPlaceholderImage = (sourceType: string) => {
    switch (sourceType) {
      case 'pdf':
        return '/file-types/PDF (1).svg';
      case 'website':
        return '/file-types/WEB (1).svg';
      case 'youtube':
        return '/file-types/WEB (1).svg';
      case 'audio':
        return '/file-types/MP3 (1).png';
      case 'text':
        return '/file-types/TXT (1).png';
      default:
        return '/file-types/DOC (1).png';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);

      if (days > 0) {
        return `${days}d ago`;
      } else if (hours > 0) {
        return `${hours}h ago`;
      } else {
        return 'Just now';
      }
    } catch {
      return 'Unknown';
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setShowDeleteDialog(false);
    
    // Start the fade-out animation
    setIsAnimatingOut(true);
    
    // Wait for animation to complete before optimistically removing
    setTimeout(() => {
      onOptimisticDelete?.(source.id);
    }, 300);
    
    try {
      await deleteSourceAsync(source.id);
      toast({
        title: "Source deleted",
        description: `"${source.title}" has been removed from your feed.`,
      });
      // Don't call onDeleteComplete - let the real-time subscription handle the final removal
      // The optimistic deletion will keep the item hidden until it's actually removed from the cache
    } catch (error) {
      console.error('Error deleting feed source:', error);
      toast({
        title: "Error",
        description: "Failed to delete source. Please try again.",
        variant: "destructive",
      });
      // Roll back the animation and optimistic deletion on error
      setIsAnimatingOut(false);
      onDeleteError?.(source.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      await toggleFavoriteAsync(source.id);
      // Update local state immediately for instant feedback
      setIsFavorite(!isFavorite);
      toast({
        title: isFavorite ? "Removed from favorites" : "Added to favorites",
        description: `"${source.title}" has been ${isFavorite ? 'removed from' : 'added to'} your favorites.`,
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

  const handleExternalLinkClick = () => {
    if (source.url) {
      window.open(source.url, '_blank');
    }
  };

  const handlePublisherClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (source.url) {
      window.open(source.url, '_blank');
    }
  };

  const handleCardClick = () => {
    if (onOpenDetail) {
      onOpenDetail(source);
    }
  };

  const handleSelectionChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelectionChange) {
      onSelectionChange(source.id, !isSelected);
    }
  };

  // Select Button Component
  const SelectButton = ({ isListView = false }: { isListView?: boolean }) => (
    <div className={`absolute ${isListView ? 'top-3 left-3' : 'top-3 left-3'} z-10 transition-opacity duration-200 ${
      isHovered || isSelected ? 'opacity-100' : 'opacity-0'
    }`}>
      <Button
        variant="secondary"
        size="icon"
        className={isListView 
          ? `h-6 w-6 ${isSelected ? 'bg-blue-600 hover:bg-blue-700 border-blue-600' : 'bg-white/90 hover:bg-white border-gray-300'} shadow-sm`
          : `h-6 w-6 ${isSelected ? 'bg-blue-600 hover:bg-blue-700 border-blue-600' : 'bg-white/90 hover:bg-white border-gray-300'} shadow-sm`
        }
        onClick={handleSelectionChange}
      >
        {isSelected ? (
          <Check className="h-3 w-3 text-white" />
        ) : (
          <div className="h-3 w-3" />
        )}
      </Button>
    </div>
  );

  // Hover Action Buttons Component
  const HoverActions = ({ isListView = false }: { isListView?: boolean }) => (
    <div 
      className={`absolute ${isListView ? 'top-3 right-3' : 'top-3 right-3'} flex gap-2 transition-opacity duration-200 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <Button
        variant="secondary"
        size="icon"
        className={isListView ? "h-8 w-8 bg-transparent hover:bg-transparent border-none shadow-none p-0" : "h-8 w-8 bg-white/90 hover:bg-white shadow-sm"}
        onClick={(e) => {
          e.stopPropagation();
          handleToggleFavorite();
        }}
        disabled={isTogglingFavorite}
      >
        <Star 
          className={`h-4 w-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} 
        />
      </Button>
      
      {onCategorize && (
        <Button
          variant="secondary"
          size="icon"
          className={isListView ? "h-8 w-8 bg-transparent hover:bg-transparent border-none shadow-none p-0" : "h-8 w-8 bg-white/90 hover:bg-white shadow-sm"}
          onClick={(e) => {
            e.stopPropagation();
            onCategorize(source);
          }}
        >
          <Tag className="h-4 w-4 text-gray-600" />
        </Button>
      )}
      
      <Button
        variant="secondary"
        size="icon"
        className={isListView ? "h-8 w-8 bg-transparent hover:bg-transparent border-none shadow-none p-0" : "h-8 w-8 bg-white/90 hover:bg-white shadow-sm"}
        onClick={(e) => {
          e.stopPropagation();
          setShowDeleteDialog(true);
        }}
      >
        <Trash2 className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  );

  if (viewMode === 'list') {
    return (
      <>
        <div
          className={`flex transition-all duration-300 bg-white rounded-lg overflow-hidden relative cursor-pointer ${
            isAnimatingOut ? 'opacity-0 scale-95 transform translate-y-2' : 'opacity-100 scale-100 transform translate-y-0'
          }`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleCardClick}
        >
          {/* Select Button for List View - Top Left of Card */}
          <SelectButton isListView={true} />
          
          {/* Hover Actions for List View - Top Right of Card */}
          <HoverActions isListView={true} />
          
          {/* Left Side - Image */}
          <div className="flex-shrink-0 w-48">
            <div className="w-full h-32 bg-gray-100 relative rounded-lg overflow-hidden">
              <img 
                src={source.image_url || getPlaceholderImage(source.type)}
                alt={source.title}
                className={`w-full h-full ${source.image_url ? 'object-cover' : 'object-contain p-4'}`}
                onError={(e) => {
                  const imgElement = e.currentTarget as HTMLImageElement;
                  if (imgElement.src !== getPlaceholderImage(source.type)) {
                    imgElement.src = getPlaceholderImage(source.type);
                    imgElement.className = 'w-full h-full object-contain p-4';
                  }
                }}
              />
            </div>
          </div>
          
          {/* Right Side - Content */}
          <div className="flex-1 p-4 flex flex-col justify-between">
            {/* Header */}
            <div className="flex-1">
              {/* Title */}
              <div className="mb-2">
                <CardTitle className="text-base line-clamp-2">
                  {source.title}
                </CardTitle>
              </div>
              
              {/* Publisher, Time, and Categories */}
              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2 flex-wrap">
                {source.url ? (
                  <>
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={`https://www.google.com/s2/favicons?domain=${getDomain(source.url)}&sz=32`} />
                      <AvatarFallback>{getDomain(source.url)[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <button
                      onClick={handlePublisherClick}
                      className="truncate hover:text-blue-600 hover:underline"
                    >
                      {getDomain(source.url)}
                    </button>
                    <span>•</span>
                  </>
                ) : null}
                
                {/* Time and Icon */}
                <div className="flex items-center space-x-1">
                  {source.type !== 'website' && getSourceIcon()}
                  <span>{formatDate(source.created_at)}</span>
                </div>
                
                {/* Categories */}
                {source.category && source.category.length > 0 && (
                  <>
                    <span>•</span>
                    <div className="flex flex-wrap gap-1">
                      {source.category.slice(0, 3).map((cat, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                      {source.category.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{source.category.length - 3}
                        </Badge>
                      )}
                    </div>
                  </>
                )}
              </div>
              
              {/* Description */}
              {(source.short_description || source.summary) && (
                <CardDescription className="line-clamp-2 mb-3">
                  {source.short_description || source.summary}
                </CardDescription>
              )}
              
              {/* Processing Status */}
              {shouldShowStatus() && (
                <div 
                  className="flex items-center space-x-1 transition-opacity duration-2000 mb-2"
                  style={{ opacity: statusOpacity }}
                >
                  {getStatusIcon()}
                  <span className="text-sm text-gray-600">{getStatusText()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {source.title}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove this source from your feed. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete} 
                className="bg-red-600 hover:bg-red-700" 
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Card View Layout - Vertical
  return (
    <>
      <Card 
        className={`overflow-hidden transition-all duration-300 relative cursor-pointer ${
          isAnimatingOut ? 'opacity-0 scale-95 transform translate-y-2' : 'opacity-100 scale-100 transform translate-y-0'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        {/* Featured Image */}
        <div className="relative">
          <div className="aspect-video bg-gray-100 relative">
            <img 
              src={source.image_url || getPlaceholderImage(source.type)}
              alt={source.title}
              className={`w-full h-full ${source.image_url ? 'object-cover' : 'object-contain p-8'}`}
              onError={(e) => {
                const imgElement = e.currentTarget as HTMLImageElement;
                if (imgElement.src !== getPlaceholderImage(source.type)) {
                  imgElement.src = getPlaceholderImage(source.type);
                  imgElement.className = 'w-full h-full object-contain p-8';
                }
              }}
            />
            <SelectButton />
            <HoverActions />
          </div>
        </div>

        {/* Card Content - Title and time moved below image */}
        <CardContent className="p-4">
          {/* Title */}
          <div className="mb-2">
            <CardTitle className="text-base line-clamp-2">
              {source.title}
            </CardTitle>
          </div>
          
          {/* Publisher, Time, and Categories */}
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-3 flex-wrap">
            {source.url ? (
              <>
                <Avatar className="h-4 w-4">
                  <AvatarImage src={`https://www.google.com/s2/favicons?domain=${getDomain(source.url)}&sz=32`} />
                  <AvatarFallback>{getDomain(source.url)[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <button
                  onClick={handlePublisherClick}
                  className="truncate hover:text-blue-600 hover:underline"
                >
                  {getDomain(source.url)}
                </button>
                <span>•</span>
              </>
            ) : null}
            
            {/* Time and Icon */}
            <div className="flex items-center space-x-1">
              {source.type !== 'website' && getSourceIcon()}
              <span>{formatDate(source.created_at)}</span>
            </div>
            
            {/* Categories */}
            {source.category && source.category.length > 0 && (
              <>
                <span>•</span>
                <div className="flex flex-wrap gap-1">
                  {source.category.slice(0, 2).map((cat, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {cat}
                    </Badge>
                  ))}
                  {source.category.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{source.category.length - 2}
                    </Badge>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Description */}
          {(source.short_description || source.summary) && (
            <CardDescription className="line-clamp-3 mb-3">
              {source.short_description || source.summary}
            </CardDescription>
          )}
          
          {/* Processing Status */}
          {shouldShowStatus() && (
            <div 
              className="flex items-center space-x-1 transition-opacity duration-2000 mb-2"
              style={{ opacity: statusOpacity }}
            >
              {getStatusIcon()}
              <span className="text-sm text-gray-600">{getStatusText()}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {source.title}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this source from your feed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-red-600 hover:bg-red-700" 
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FeedSourceCard;