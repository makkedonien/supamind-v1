import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Mic, FileText, Loader2 } from 'lucide-react';
import { useMicrocasts } from '@/hooks/useMicrocasts';

import { useNavigate } from 'react-router-dom';
import MicrocastCard from '@/components/microcasts/MicrocastCard';

const Microcasts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { microcasts, isLoading, error } = useMicrocasts();


  const handleGoToFeed = () => {
    navigate('/');
  };



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
            <h1 className="text-gray-900" style={{ fontSize: '20px', fontWeight: '600' }}>Your Microcasts</h1>
            <p className="text-gray-600 mt-1" style={{ fontSize: '14px' }}>
              AI-generated podcast conversations from your sources
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button onClick={handleGoToFeed}>
              <Plus className="h-4 w-4 mr-2" />
              Create Microcast
            </Button>
          </div>
        </div>



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

        {/* Microcasts Grid */}
        {!isLoading && !error && microcasts.length > 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {microcasts.map((microcast) => (
                <MicrocastCard
                  key={microcast.id}
                  microcast={microcast}
                />
              ))}
            </div>
          </div>
        )}


      </div>
    </main>
  );
};

export default Microcasts; 