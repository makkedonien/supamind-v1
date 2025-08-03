import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Play, Pause, RotateCcw, Volume2, Download, MoreVertical, Trash2, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { useMicrocasts } from '@/hooks/useMicrocasts';
import { Tables } from '@/integrations/supabase/types';

type Microcast = Tables<'microcasts'>;

interface MicrocastPlayerProps {
  microcast: Microcast;
  onDeleted?: () => void;
  onRetry?: () => void;
}

const MicrocastPlayer: React.FC<MicrocastPlayerProps> = ({ 
  microcast, 
  onDeleted,
  onRetry
}) => {
  const { toast } = useToast();
  const { playerState, playMicrocast, pausePlayback, resumePlayback, seekTo, setVolume } = useAudioPlayer();
  const { deleteMicrocast, isDeleting, refreshAudioUrl, isRefreshing } = useMicrocasts();

  // Check if this microcast is currently playing
  const isCurrentMicrocast = playerState.currentMicrocast?.id === microcast.id;
  const isPlaying = isCurrentMicrocast && playerState.isPlaying;
  const loading = isCurrentMicrocast && playerState.loading;
  const error = isCurrentMicrocast && playerState.error;

  // Check if audio is expired
  const isExpired = microcast.audio_expires_at ? new Date(microcast.audio_expires_at) <= new Date() : false;

  const togglePlayPause = () => {
    if (!microcast.audio_url || microcast.generation_status !== 'completed') return;

    if (isCurrentMicrocast && isPlaying) {
      pausePlayback();
    } else if (isCurrentMicrocast && !isPlaying) {
      resumePlayback();
    } else {
      playMicrocast(microcast);
    }
  };

  const handleSeek = (value: number[]) => {
    if (!isCurrentMicrocast) return;
    seekTo(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  const restart = () => {
    if (!isCurrentMicrocast) return;
    seekTo(0);
  };

  const retryLoad = () => {
    if (onRetry) {
      onRetry();
    } else if (isExpired) {
      refreshAudioUrl(microcast.id);
    } else {
      playMicrocast(microcast);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const downloadAudio = async () => {
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

  const handleDelete = () => {
    deleteMicrocast(microcast.id);
    onDeleted?.();
  };

  const getStatusColor = () => {
    switch (microcast.generation_status) {
      case 'completed':
        return 'text-green-600';
      case 'generating':
      case 'processing':
        return 'text-blue-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
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

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{microcast.title}</h4>
          <p className="text-sm text-gray-500 mt-1">
            {microcast.source_ids.length} source{microcast.source_ids.length !== 1 ? 's' : ''}
          </p>
          <span className={`text-xs ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" disabled={isDeleting}>
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MoreVertical className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {microcast.generation_status === 'completed' && microcast.audio_url && (
              <DropdownMenuItem onClick={downloadAudio}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
            )}
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

      {/* Generation Status Indicators */}
      {microcast.generation_status === 'generating' && (
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md border border-blue-200">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
            <span className="text-sm text-blue-600">Generating your microcast...</span>
          </div>
        </div>
      )}

      {microcast.generation_status === 'failed' && (
        <div className="flex items-center justify-between p-3 bg-red-50 rounded-md border border-red-200">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-600">Generation failed</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={retryLoad}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </div>
      )}

      {/* Refresh indicator */}
      {isRefreshing && (
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md border border-blue-200">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
            <span className="text-sm text-blue-600">Refreshing audio access...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isRefreshing && (
        <div className="flex items-center justify-between p-3 bg-red-50 rounded-md border border-red-200">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-600">{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={retryLoad}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </div>
      )}

      {/* Player Controls - Only show if generation is completed */}
      {microcast.generation_status === 'completed' && microcast.audio_url && (
        <>
          {/* Progress Bar */}
          <div className="space-y-2">
            <Slider
              value={[isCurrentMicrocast ? playerState.currentTime : 0]}
              max={isCurrentMicrocast ? playerState.duration || 100 : 100}
              step={1}
              onValueChange={handleSeek}
              className="w-full"
              disabled={loading || !!error || !isCurrentMicrocast}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatTime(isCurrentMicrocast ? playerState.currentTime : 0)}</span>
              <span>{formatTime(isCurrentMicrocast ? playerState.duration : 0)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={restart}
                disabled={loading || !!error || !isCurrentMicrocast}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              
              <Button
                variant="default"
                size="sm"
                onClick={togglePlayPause}
                disabled={loading || !!error}
                className="w-12"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center space-x-2 w-24">
              <Volume2 className="h-4 w-4 text-gray-500" />
              <Slider
                value={[playerState.volume]}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
                className="flex-1"
              />
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

export default MicrocastPlayer;