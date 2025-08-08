import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Play, Pause, Loader2, AlertTriangle, Clock, Mic, FileText, Link as LinkIcon, Youtube, Volume2, MoreVertical, Download, Trash2 } from 'lucide-react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { Tables } from '@/integrations/supabase/types';
import { useFeedSources } from '@/hooks/useFeedSources';
import { useMicrocasts } from '@/hooks/useMicrocasts';
import { useToast } from '@/hooks/use-toast';

type Microcast = Tables<'microcasts'>;

interface MicrocastCardProps {
  microcast: Microcast;
  onClick?: () => void;
}

const MicrocastCard: React.FC<MicrocastCardProps> = ({ microcast, onClick }) => {
  const { playerState, playMicrocast, pausePlayback, resumePlayback } = useAudioPlayer();
  const { allSources } = useFeedSources();
  const { deleteMicrocast, isDeleting } = useMicrocasts();
  const { toast } = useToast();

  // Check if this microcast is currently playing
  const isCurrentMicrocast = playerState.currentMicrocast?.id === microcast.id;
  const isPlaying = isCurrentMicrocast && playerState.isPlaying;
  const loading = isCurrentMicrocast && playerState.loading;

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!microcast.audio_url || microcast.generation_status !== 'completed') return;

    if (isCurrentMicrocast && isPlaying) {
      pausePlayback();
    } else if (isCurrentMicrocast && !isPlaying) {
      resumePlayback();
    } else {
      playMicrocast(microcast);
    }
  };

  const getStatusColor = () => {
    switch (microcast.generation_status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'generating':
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusText = () => {
    switch (microcast.generation_status) {
      case 'completed':
        return 'Ready';
      case 'generating':
        return 'Generating...';
      case 'processing':
        return 'Processing...';
      case 'failed':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  const getStatusIcon = () => {
    switch (microcast.generation_status) {
      case 'completed':
        return <Mic className="h-3 w-3" />;
      case 'generating':
      case 'processing':
        return <Loader2 className="h-3 w-3 animate-spin" />;
      case 'failed':
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };


  const formatDuration = () => {
    if (isCurrentMicrocast && playerState.duration > 0) {
      const minutes = Math.floor(playerState.duration / 60);
      const seconds = Math.floor(playerState.duration % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return null;
  };

  // Get sources for this microcast
  const microcastSources = allSources.filter(source => 
    microcast.source_ids.includes(source.id)
  );

  // Utility functions for source display
  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-3 w-3 text-red-600" />;
      case 'website':
        return <LinkIcon className="h-3 w-3 text-green-600" />;
      case 'youtube':
        return <Youtube className="h-3 w-3 text-red-600" />;
      case 'audio':
        return <Volume2 className="h-3 w-3 text-purple-600" />;
      case 'text':
        return <FileText className="h-3 w-3 text-blue-600" />;
      default:
        return <FileText className="h-3 w-3 text-gray-600" />;
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

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const truncateTitle = (title: string, maxLength: number = 40) => {
    if (title.length <= maxLength) {
      return title;
    }
    return title.substring(0, maxLength).trim() + '...';
  };

  // Check if audio is expired
  const isExpired = microcast.audio_expires_at ? new Date(microcast.audio_expires_at) <= new Date() : false;

  // Format expiration date
  const formatExpirationText = () => {
    if (!microcast.audio_expires_at) return null;
    
    const expiryDate = new Date(microcast.audio_expires_at);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (isExpired) {
      return "Audio expired";
    } else if (diffDays === 1) {
      return "Expires in 1 day";
    } else if (diffDays <= 7) {
      return `Expires in ${diffDays} days`;
    } else {
      return `Expires ${expiryDate.toLocaleDateString()}`;
    }
  };

  const downloadAudio = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!microcast.audio_url) return;
    
    try {
      // Fetch the audio file
      const response = await fetch(microcast.audio_url);
      if (!response.ok) {
        throw new Error('Failed to fetch audio file');
      }
      
      // Create a blob from the response
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const blobUrl = URL.createObjectURL(blob);
      
      // Create a temporary anchor element and trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${microcast.title}.mp3`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      
      toast({
        title: "Download Started",
        description: "Your microcast is being downloaded.",
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the microcast. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteMicrocast(microcast.id);
  };


  return (
    <Card 
      className={`transition-all duration-200 cursor-pointer hover:shadow-lg ${
        isCurrentMicrocast ? 'ring-2 ring-primary bg-primary/5' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-2 mb-2">{microcast.title}</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={`${getStatusColor()}`}>
                <div className="flex items-center gap-1">
                  {getStatusIcon()}
                  <span className="text-xs">{getStatusText()}</span>
                </div>
              </Badge>
              {formatDuration() && (
                <span className="text-xs text-muted-foreground">
                  {formatDuration()}
                </span>
              )}
              {formatExpirationText() && (
                <span className={`text-xs ${isExpired ? 'text-red-600' : 'text-muted-foreground'}`}>
                  {formatExpirationText()}
                </span>
              )}
            </div>
          </div>
          
          {/* Play/Pause Button and Actions */}
          <div className="flex items-center gap-2 ml-3 flex-shrink-0">
            {/* Play button only for completed microcasts */}
            {microcast.generation_status === 'completed' && microcast.audio_url && (
              <Button
                variant={isCurrentMicrocast ? "default" : "outline"}
                size="icon"
                onClick={togglePlayPause}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            )}
            
            {/* Dropdown Menu - always visible */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isDeleting}>
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MoreVertical className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* Download option only for completed microcasts */}
                {microcast.generation_status === 'completed' && microcast.audio_url && (
                  <DropdownMenuItem onClick={downloadAudio}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                )}
                {/* Delete option always available */}
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-red-600 focus:text-red-600"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Progress Bar for Currently Playing */}
        {isCurrentMicrocast && playerState.duration > 0 && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className="bg-primary h-1 rounded-full transition-all duration-200" 
                style={{ 
                  width: `${(playerState.currentTime / playerState.duration) * 100}%` 
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{Math.floor(playerState.currentTime / 60)}:{Math.floor(playerState.currentTime % 60).toString().padStart(2, '0')}</span>
              <span>{Math.floor(playerState.duration / 60)}:{Math.floor(playerState.duration % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>
        )}

        {/* Sources Section */}
        {microcastSources.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Sources</span>
              <Badge variant="secondary" className="text-xs">
                {microcastSources.length}
              </Badge>
            </div>
            
            <div className="space-y-2">
              {microcastSources.slice(0, 3).map((source) => (
                <div key={source.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50/50 border border-gray-100">
                  {/* Source Thumbnail */}
                  <div className="flex-shrink-0">
                    <img 
                      src={source.image_url || getPlaceholderImage(source.type)}
                      alt={source.title}
                      className={`w-10 h-10 rounded ${source.image_url ? 'object-cover' : 'object-contain p-1'}`}
                      onError={(e) => {
                        const imgElement = e.currentTarget as HTMLImageElement;
                        if (imgElement.src !== getPlaceholderImage(source.type)) {
                          imgElement.src = getPlaceholderImage(source.type);
                          imgElement.className = 'w-10 h-10 rounded object-contain p-1';
                        }
                      }}
                    />
                  </div>
                  
                  {/* Source Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                          {truncateTitle(source.title)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {getSourceIcon(source.type)}
                          {source.url && (
                            <div className="flex items-center gap-1">
                              <Avatar className="h-3 w-3">
                                <AvatarImage src={`https://www.google.com/s2/favicons?domain=${getDomain(source.url)}&sz=16`} />
                                <AvatarFallback className="text-xs">{getDomain(source.url)[0]?.toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-gray-500 truncate">
                                {getDomain(source.url)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {microcastSources.length > 3 && (
                <div className="text-center py-1">
                  <span className="text-xs text-gray-500">
                    +{microcastSources.length - 3} more source{microcastSources.length - 3 !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
};

export default MicrocastCard;