import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Mic, LayoutGrid, List, FileText, Loader2 } from 'lucide-react';
import { useMicrocasts } from '@/hooks/useMicrocasts';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import MicrocastCard from '@/components/microcasts/MicrocastCard';
import MicrocastPlayer from '@/components/microcasts/MicrocastPlayer';

const Microcasts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { microcasts, isLoading, error } = useMicrocasts();
  const isMobile = useIsMobile();
  
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [selectedMicrocast, setSelectedMicrocast] = useState<string | null>(null);

  // Get initial view mode based on mobile state
  const getInitialViewMode = (): 'cards' | 'list' => {
    if (isMobile) return 'cards';
    
    // On desktop, try to load saved preference
    if (typeof window !== 'undefined') {
      const savedView = localStorage.getItem('microcastViewMode');
      if (savedView === 'cards' || savedView === 'list') {
        return savedView;
      }
    }
    
    return 'cards'; // Default
  };

  // Load view mode preference on mount
  React.useEffect(() => {
    setViewMode(getInitialViewMode());
  }, []);

  // Save view preference (only on desktop)
  React.useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('microcastViewMode', viewMode);
    }
  }, [viewMode, isMobile]);

  const handleGoToFeed = () => {
    navigate('/');
  };

  const handleMicrocastClick = (microcastId: string) => {
    setSelectedMicrocast(selectedMicrocast === microcastId ? null : microcastId);
  };

  const selectedMicrocastData = selectedMicrocast ? 
    microcasts.find(m => m.id === selectedMicrocast) : null;

  // Statistics
  const completedMicrocasts = microcasts.filter(m => m.generation_status === 'completed').length;
  const generatingMicrocasts = microcasts.filter(m => 
    m.generation_status === 'generating' || m.generation_status === 'processing'
  ).length;

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Microcasts</h1>
            <p className="text-gray-600 mt-1">
              AI-generated podcast conversations from your sources
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Mode Toggle - Desktop only */}
            {!isMobile && microcasts.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">View:</span>
                <div className="flex border rounded-md p-1 bg-muted/50">
                  <Button
                    variant={viewMode === 'cards' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('cards')}
                    className="h-8 px-3"
                  >
                    <LayoutGrid className="h-4 w-4 mr-1" />
                    Cards
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8 px-3"
                  >
                    <List className="h-4 w-4 mr-1" />
                    List
                  </Button>
                </div>
              </div>
            )}
            
            <Button onClick={handleGoToFeed}>
              <Plus className="h-4 w-4 mr-2" />
              Create Microcast
            </Button>
          </div>
        </div>

        {/* Statistics */}
        {microcasts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Mic className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{completedMicrocasts}</p>
                    <p className="text-sm text-gray-600">Ready to Listen</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Loader2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{generatingMicrocasts}</p>
                    <p className="text-sm text-gray-600">Generating</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{microcasts.length}</p>
                    <p className="text-sm text-gray-600">Total Microcasts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Loading your microcasts...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-red-400 text-2xl">⚠️</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Microcasts</h3>
            <p className="text-gray-600">Please refresh the page to try again.</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && microcasts.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Mic className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Microcasts Yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first microcast by selecting sources from your feed and generating an AI-powered podcast conversation.
            </p>
            <Button onClick={handleGoToFeed}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Microcast
            </Button>
          </div>
        )}

        {/* Microcasts Grid/List */}
        {!isLoading && !error && microcasts.length > 0 && (
          <div className="space-y-6">
            {/* Cards View */}
            {viewMode === 'cards' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {microcasts.map((microcast) => (
                  <MicrocastCard
                    key={microcast.id}
                    microcast={microcast}
                    onClick={() => handleMicrocastClick(microcast.id)}
                  />
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-4">
                {microcasts.map((microcast) => (
                  <MicrocastPlayer
                    key={microcast.id}
                    microcast={microcast}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selected Microcast Detail Player */}
        {selectedMicrocastData && viewMode === 'cards' && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Now Playing</h3>
            <MicrocastPlayer
              microcast={selectedMicrocastData}
              onDeleted={() => setSelectedMicrocast(null)}
            />
          </div>
        )}
      </div>
    </main>
  );
};

export default Microcasts; 