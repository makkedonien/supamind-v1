import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MoreVertical, ExternalLink, Edit, Trash2, Tag, FileText, Link as LinkIcon, Youtube, Volume2, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
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
  created_at: string;
  updated_at: string;
}

interface FeedSourceCardProps {
  source: FeedSource;
  onEdit?: (source: FeedSource) => void;
  onCategorize?: (source: FeedSource) => void;
}

const FeedSourceCard = ({ source, onEdit, onCategorize }: FeedSourceCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { deleteSourceAsync } = useFeedSources();
  const { toast } = useToast();

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

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
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
    try {
      await deleteSourceAsync(source.id);
      toast({
        title: "Source deleted",
        description: `"${source.title}" has been removed from your feed.`,
      });
    } catch (error) {
      console.error('Error deleting feed source:', error);
      toast({
        title: "Error",
        description: "Failed to delete source. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleExternalLinkClick = () => {
    if (source.url) {
      window.open(source.url, '_blank');
    }
  };

  return (
    <>
      <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg">
        {/* Card Header */}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <div className="flex-shrink-0 mt-1">
                {getSourceIcon()}
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base line-clamp-2 mb-1">
                  {source.title}
                </CardTitle>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  {source.url && (
                    <>
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={`https://www.google.com/s2/favicons?domain=${getDomain(source.url)}&sz=32`} />
                        <AvatarFallback>{getDomain(source.url)[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="truncate">{getDomain(source.url)}</span>
                      <span>•</span>
                    </>
                  )}
                  <span>{formatDate(source.created_at)}</span>
                </div>
              </div>
            </div>
            
            {/* Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="flex-shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {source.url && (
                  <>
                    <DropdownMenuItem onClick={handleExternalLinkClick}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open original
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(source)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit title
                  </DropdownMenuItem>
                )}
                {onCategorize && (
                  <DropdownMenuItem onClick={() => onCategorize(source)}>
                    <Tag className="h-4 w-4 mr-2" />
                    Manage categories
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        {/* Card Content */}
        <CardContent className="pt-0">
          {/* Description */}
          {(source.short_description || source.summary) && (
            <CardDescription className="line-clamp-3 mb-3">
              {source.short_description || source.summary}
            </CardDescription>
          )}

          {/* Categories */}
          {source.category && source.category.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {source.category.map((cat, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {cat}
                </Badge>
              ))}
            </div>
          )}

          {/* Publisher */}
          {source.publisher_name && (
            <div className="text-sm text-gray-600 mb-2">
              Published by {source.publisher_name}
            </div>
          )}

          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <span className="text-sm text-gray-600">{getStatusText()}</span>
            </div>
            
            {source.type && (
              <Badge variant="outline" className="text-xs">
                {source.type.toUpperCase()}
              </Badge>
            )}
          </div>
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