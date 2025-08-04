import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Loader2, AlertTriangle, Clock, Mic, Bug, ExternalLink } from 'lucide-react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { Tables } from '@/integrations/supabase/types';

type Microcast = Tables<'microcasts'>;

interface MicrocastCardProps {
  microcast: Microcast;
  onClick?: () => void;
}

const MicrocastCard: React.FC<MicrocastCardProps> = ({ microcast, onClick }) => {
  const { playerState, playMicrocast, pausePlayback, resumePlayback } = useAudioPlayer();
  const [showDebug, setShowDebug] = useState(false);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = () => {
    if (isCurrentMicrocast && playerState.duration > 0) {
      const minutes = Math.floor(playerState.duration / 60);
      const seconds = Math.floor(playerState.duration % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return null;
  };

  const testAudioUrl = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!microcast.audio_url) {
      console.log('No audio URL to test');
      return;
    }

    console.log('Testing audio URL:', microcast.audio_url);
    
    // Basic URL validation
    try {
      new URL(microcast.audio_url);
      console.log('✓ URL format is valid');
    } catch (error) {
      console.error('✗ Invalid URL format:', error);
      return;
    }

    // Check if URL is expired based on expiry date
    if (microcast.audio_expires_at) {
      const expiryDate = new Date(microcast.audio_expires_at);
      const now = new Date();
      if (now > expiryDate) {
        console.warn('⚠️ Audio URL has expired:', {
          expiryDate: expiryDate.toISOString(),
          now: now.toISOString(),
          expiredMinutesAgo: Math.floor((now.getTime() - expiryDate.getTime()) / (1000 * 60))
        });
      } else {
        console.log('✓ Audio URL has not expired yet');
      }
    }
    
    // Test HTTP accessibility
    try {
      const response = await fetch(microcast.audio_url, { method: 'HEAD' });
      console.log('Audio URL HTTP test result:', {
        url: microcast.audio_url,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        type: response.type,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.ok) {
        console.log('✓ Audio URL is accessible');
      } else {
        console.error('✗ Audio URL returned error status:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('✗ Audio URL network test failed:', {
        url: microcast.audio_url,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
    }

    // Test with actual audio element (similar to what the player does)
    try {
      const testAudio = new Audio();
      
      const testPromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          cleanup();
          reject(new Error('Audio test timeout after 10 seconds'));
        }, 10000);

        const cleanup = () => {
          clearTimeout(timeout);
          testAudio.removeEventListener('loadedmetadata', onLoaded);
          testAudio.removeEventListener('error', onError);
          testAudio.removeEventListener('canplay', onCanPlay);
        };

        const onLoaded = () => {
          console.log('✓ Audio metadata loaded successfully:', {
            duration: testAudio.duration,
            readyState: testAudio.readyState,
            networkState: testAudio.networkState
          });
          cleanup();
          resolve();
        };

        const onCanPlay = () => {
          console.log('✓ Audio can play:', {
            duration: testAudio.duration,
            readyState: testAudio.readyState
          });
        };

        const onError = (e: Event) => {
          const error = (e.target as HTMLAudioElement)?.error;
          console.error('✗ Audio element test failed:', {
            errorCode: error?.code,
            errorMessage: error?.message,
            readyState: testAudio.readyState,
            networkState: testAudio.networkState
          });
          cleanup();
          reject(new Error(`Audio error: ${error?.message || 'Unknown error'}`));
        };

        testAudio.addEventListener('loadedmetadata', onLoaded);
        testAudio.addEventListener('error', onError);
        testAudio.addEventListener('canplay', onCanPlay);
      });

      testAudio.src = microcast.audio_url;
      testAudio.load();
      
      await testPromise;
      console.log('✓ Audio element test completed successfully');
      
    } catch (error) {
      console.error('✗ Audio element test failed:', error);
    }
  };

  const copyDebugInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const debugInfo = {
      microcast: {
        id: microcast.id,
        title: microcast.title,
        audio_url: microcast.audio_url,
        audio_expires_at: microcast.audio_expires_at,
        generation_status: microcast.generation_status,
        source_ids: microcast.source_ids,
        created_at: microcast.created_at,
        updated_at: microcast.updated_at
      },
      playerState: {
        currentMicrocast: playerState.currentMicrocast?.id,
        isPlaying: playerState.isPlaying,
        loading: playerState.loading,
        error: playerState.error,
        currentTime: playerState.currentTime,
        duration: playerState.duration
      }
    };

    navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))
      .then(() => console.log('Debug info copied to clipboard'))
      .catch(err => console.error('Failed to copy debug info:', err));
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
          
          <div className="flex items-center gap-2 ml-3 flex-shrink-0">
            {/* Debug Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                setShowDebug(!showDebug);
              }}
              title="Toggle debug info"
            >
              <Bug className="h-3 w-3" />
            </Button>
            
            {/* Play/Pause Button */}
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
          </div>
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

        {/* Debug Information */}
        {showDebug && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700">Debug Info</span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testAudioUrl}
                  className="h-6 text-xs"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Test URL
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyDebugInfo}
                  className="h-6 text-xs"
                >
                  Copy Data
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-600">ID:</span>
                <div className="font-mono break-all">{microcast.id}</div>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <div>{microcast.generation_status}</div>
              </div>
              <div>
                <span className="text-gray-600">Created:</span>
                <div>{formatDate(microcast.created_at)}</div>
              </div>
              <div>
                <span className="text-gray-600">Updated:</span>
                <div>{formatDate(microcast.updated_at)}</div>
              </div>
            </div>
            
            {microcast.audio_url && (
              <div>
                <span className="text-gray-600">Audio URL:</span>
                <div className="font-mono text-xs break-all bg-white p-1 rounded border">
                  {microcast.audio_url}
                </div>
              </div>
            )}
            
            {microcast.audio_expires_at && (
              <div>
                <span className="text-gray-600">Expires:</span>
                <div>{formatDate(microcast.audio_expires_at)}</div>
              </div>
            )}
            
            {playerState.error && isCurrentMicrocast && (
              <div>
                <span className="text-red-600">Player Error:</span>
                <div className="text-red-600">{playerState.error}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MicrocastCard;