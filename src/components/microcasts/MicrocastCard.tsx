import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Loader2, AlertTriangle, Clock, Mic } from 'lucide-react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { Tables } from '@/integrations/supabase/types';

type Microcast = Tables<'microcasts'>;

interface MicrocastCardProps {
  microcast: Microcast;
  onClick?: () => void;
}

const MicrocastCard: React.FC<MicrocastCardProps> = ({ microcast, onClick }) => {
  const { playerState, playMicrocast, pausePlayback, resumePlayback } = useAudioPlayer();

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


  return (
    <Card 
      className={`transition-all duration-200 cursor-pointer hover:shadow-lg ${
        isCurrentMicrocast ? 'ring-2 ring-primary bg-primary/5' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-2">{microcast.title}</CardTitle>
            <CardDescription className="mt-1">
              {microcast.source_ids.length} source{microcast.source_ids.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          
          {/* Play/Pause Button */}
          {microcast.generation_status === 'completed' && microcast.audio_url && (
            <Button
              variant={isCurrentMicrocast ? "default" : "outline"}
              size="icon"
              className="ml-3 flex-shrink-0"
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
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
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
        </div>

        {/* Progress Bar for Currently Playing */}
        {isCurrentMicrocast && playerState.duration > 0 && (
          <div className="mt-3">
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

      </CardContent>
    </Card>
  );
};

export default MicrocastCard;