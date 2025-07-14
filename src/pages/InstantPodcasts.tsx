import React from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useAuth } from '@/contexts/AuthContext';

const InstantPodcasts = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userEmail={user?.email} />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-medium text-gray-900 mb-2">Instant Podcasts</h1>
          <p className="text-gray-600">Generate AI-powered podcast conversations from any content</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-gray-400 text-2xl">🎙️</span>
          </div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">Coming Soon</h2>
          <p className="text-gray-600">
            Create instant podcast-style conversations from your documents, articles, and research materials.
          </p>
        </div>
      </main>
    </div>
  );
};

export default InstantPodcasts;