import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize2, X, Loader2 } from 'lucide-react';
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
  
  const [showExpandedPlayer, setShowExpandedPlayer] = useState(false);

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

  const skip = (seconds: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    seekTo(newTime);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

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
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 h-1">
          <div 
            className="bg-primary h-1 transition-all duration-200" 
            style={{ width: `${progressPercentage}%` }}
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
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => skip(-15)}
              disabled={loading || error}
              className="hidden sm:flex"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            
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
              onClick={() => skip(15)}
              disabled={loading || error}
              className="hidden sm:flex"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExpandedPlayer(true)}
              className="hidden md:flex"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            
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

      {/* Expanded Player Sheet */}
      <Sheet open={showExpandedPlayer} onOpenChange={setShowExpandedPlayer}>
        <SheetContent side="bottom" className="h-[400px]">
          <SheetHeader>
            <SheetTitle>{currentMicrocast.title}</SheetTitle>
          </SheetHeader>
          
          <div className="flex flex-col h-full pt-6">
            {/* Large Album Art / Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-32 h-32 bg-primary/10 rounded-2xl flex items-center justify-center">
                <span className="text-primary text-6xl">🎙️</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2 mb-6">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={1}
                onValueChange={handleSeek}
                className="w-full"
                disabled={loading || !!error}
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center space-x-6 mb-6">
              <Button
                variant="ghost"
                size="lg"
                onClick={() => skip(-15)}
                disabled={loading || error}
              >
                <SkipBack className="h-6 w-6" />
              </Button>
              
              <Button
                variant="default"
                size="lg"
                onClick={togglePlayPause}
                disabled={loading || error}
                className="w-16 h-16 rounded-full"
              >
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="lg"
                onClick={() => skip(15)}
                disabled={loading || error}
              >
                <SkipForward className="h-6 w-6" />
              </Button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center space-x-3 mt-auto">
              <Volume2 className="h-5 w-5 text-gray-500" />
              <Slider
                value={[volume]}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
                className="flex-1"
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Spacer to prevent content from being hidden behind the mini player */}
      <div className="h-16" />
    </>
  );
};

export default StickyAudioPlayer;