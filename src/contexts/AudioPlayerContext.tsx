import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { Tables } from '@/integrations/supabase/types';

type Microcast = Tables<'microcasts'>;

interface AudioPlayerState {
  currentMicrocast: Microcast | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  loading: boolean;
  error: string | null;
}

interface AudioPlayerContextType {
  // State
  playerState: AudioPlayerState;
  
  // Actions
  playMicrocast: (microcast: Microcast) => void;
  pausePlayback: () => void;
  resumePlayback: () => void;
  stopPlayback: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  
  // Audio element ref for direct access
  audioRef: React.RefObject<HTMLAudioElement>;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};

interface AudioPlayerProviderProps {
  children: ReactNode;
}

export const AudioPlayerProvider: React.FC<AudioPlayerProviderProps> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [playerState, setPlayerState] = useState<AudioPlayerState>({
    currentMicrocast: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    loading: false,
    error: null,
  });

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setPlayerState(prev => ({ 
        ...prev, 
        currentTime: audio.currentTime 
      }));
    };

    const handleDurationChange = () => {
      setPlayerState(prev => ({ 
        ...prev, 
        duration: audio.duration || 0,
        loading: false,
        error: null
      }));
    };

    const handleEnded = () => {
      setPlayerState(prev => ({ 
        ...prev, 
        isPlaying: false,
        currentTime: 0
      }));
    };

    const handleError = (e: Event) => {
      const audio = audioRef.current;
      const target = e.target as HTMLAudioElement;
      
      // Log detailed error information
      console.error('Audio playback error:', {
        error: e,
        audioSrc: audio?.src,
        networkState: audio?.networkState,
        readyState: audio?.readyState,
        errorCode: target?.error?.code,
        errorMessage: target?.error?.message,
        currentMicrocast: playerState.currentMicrocast?.id,
        currentTime: audio?.currentTime,
        duration: audio?.duration
      });

      // Map error codes to user-friendly messages
      let errorMessage = 'Failed to load audio';
      if (target?.error) {
        switch (target.error.code) {
          case 1: // MEDIA_ERR_ABORTED
            errorMessage = 'Audio loading was aborted';
            break;
          case 2: // MEDIA_ERR_NETWORK
            errorMessage = 'Network error while loading audio';
            break;
          case 3: // MEDIA_ERR_DECODE
            errorMessage = 'Audio file format not supported';
            break;
          case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
            errorMessage = 'Audio source not accessible';
            break;
        }
      }

      setPlayerState(prev => ({ 
        ...prev, 
        loading: false,
        isPlaying: false,
        error: errorMessage
      }));
    };

    const handleLoadStart = () => {
      setPlayerState(prev => ({ 
        ...prev, 
        loading: true,
        error: null
      }));
    };

    const handleCanPlay = () => {
      setPlayerState(prev => ({ 
        ...prev, 
        loading: false,
        error: null
      }));
    };

    const handlePlay = () => {
      setPlayerState(prev => ({ 
        ...prev, 
        isPlaying: true
      }));
    };

    const handlePause = () => {
      setPlayerState(prev => ({ 
        ...prev, 
        isPlaying: false
      }));
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadedmetadata', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadedmetadata', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  const playMicrocast = (microcast: Microcast) => {
    const audio = audioRef.current;
    
    if (!audio) {
      console.error('Audio element not available');
      return;
    }

    if (!microcast.audio_url) {
      console.error('No audio URL provided for microcast:', microcast.id);
      setPlayerState(prev => ({ 
        ...prev, 
        error: 'No audio URL available'
      }));
      return;
    }

    // If it's a different microcast, load the new audio
    if (!playerState.currentMicrocast || playerState.currentMicrocast.id !== microcast.id) {
      setPlayerState(prev => ({ 
        ...prev, 
        currentMicrocast: microcast,
        loading: true,
        error: null,
        currentTime: 0
      }));
      
      audio.src = microcast.audio_url;
      audio.load();
    }

    // Play the audio
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error('Play failed:', error);
        setPlayerState(prev => ({ 
          ...prev, 
          error: 'Playback failed',
          loading: false,
          isPlaying: false
        }));
      });
    }
  };

  const pausePlayback = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
    }
  };

  const resumePlayback = () => {
    const audio = audioRef.current;
    if (audio && playerState.currentMicrocast?.audio_url) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Resume failed:', error);
          setPlayerState(prev => ({ 
            ...prev, 
            error: 'Playback failed'
          }));
        });
      }
    }
  };

  const stopPlayback = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setPlayerState(prev => ({ 
        ...prev, 
        currentMicrocast: null,
        isPlaying: false,
        currentTime: 0,
        loading: false,
        error: null
      }));
    }
  };

  const seekTo = (time: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
      setPlayerState(prev => ({ 
        ...prev, 
        currentTime: time
      }));
    }
  };

  const setVolume = (volume: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
      setPlayerState(prev => ({ 
        ...prev, 
        volume
      }));
    }
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        playerState,
        playMicrocast,
        pausePlayback,
        resumePlayback,
        stopPlayback,
        seekTo,
        setVolume,
        audioRef,
      }}
    >
      {children}
      {/* Global audio element */}
      <audio ref={audioRef} preload="metadata" />
    </AudioPlayerContext.Provider>
  );
};