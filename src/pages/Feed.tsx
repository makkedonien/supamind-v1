import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

const Feed = () => {
  const { user } = useAuth();

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-medium text-gray-900 mb-2">Feed</h1>
        <p className="text-gray-600">Stay updated with your latest activity and insights</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-gray-400 text-2xl">📰</span>
        </div>
        <h2 className="text-xl font-medium text-gray-900 mb-2">Coming Soon</h2>
        <p className="text-gray-600">
          Your personalized feed will show recent activity, insights, and updates from your notebooks.
        </p>
      </div>
    </main>
  );
};

export default Feed;