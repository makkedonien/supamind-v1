import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

import { Play, Pause, RotateCcw, Volume2, X, Loader2 } from 'lucide-react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { useNavigate } from 'react-router-dom';

const StickyAudioPlayer: React.FC = () => {
  const navigate = useNavigate();
  const { 
    playerState, 
    pausePlayback, 
    resumePlayback, 
    seekTo, 
    setVolume, 
    stopPlayback 
  } = useAudioPlayer();
  


  if (!playerState.currentMicrocast) {
    return null;
  }

  const { currentMicrocast, isPlaying, currentTime, duration, volume, loading, error } = playerState;

  const togglePlayPause = () => {
    if (isPlaying) {
      pausePlayback();
    } else {
      resumePlayback();
    }
  };

  const handleSeek = (value: number[]) => {
    seekTo(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };



  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const restart = () => {
    seekTo(0);
  };

  const handleStop = () => {
    stopPlayback();
  };

  const goToMicrocasts = () => {
    navigate('/microcasts');
  };

  return (
    <>
      {/* Mini Player */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        {/* Interactive Progress Bar */}
        <div className="w-full px-4 py-2 bg-gray-50">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={1}
            onValueChange={handleSeek}
            className="w-full"
            disabled={loading || !!error}
          />
        </div>
        
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left side - Microcast info */}
          <div 
            className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer"
            onClick={goToMicrocasts}
          >
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-primary text-lg">🎙️</span>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-sm truncate">{currentMicrocast.title}</h4>
              <p className="text-xs text-gray-500">
                {formatTime(currentTime)} / {formatTime(duration)}
              </p>
            </div>
          </div>

          {/* Center - Play controls */}
          <div className="flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlayPause}
              disabled={loading || error}
              className="w-10 h-10"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={restart}
              disabled={loading || error}
              className="w-10 h-10"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-6 sm:ml-4">
            {/* Volume Control */}
            <div className="hidden sm:flex items-center space-x-2 w-24">
              <Volume2 className="h-4 w-4 text-gray-500" />
              <Slider
                value={[volume]}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
                className="flex-1"
              />
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStop}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Spacer to prevent content from being hidden behind the mini player */}
      <div className="h-16" />
    </>
  );
};

export default StickyAudioPlayer;