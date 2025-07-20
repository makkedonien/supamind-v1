import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotebooks } from '@/hooks/useNotebooks';
import NotebookGrid from '@/components/dashboard/NotebookGrid';
import EmptyDashboard from '@/components/dashboard/EmptyDashboard';

const Notebooks = () => {
  const { user } = useAuth();
  const { notebooks, isLoading, isError, error } = useNotebooks();
  
  const hasNotebooks = notebooks && notebooks.length > 0;

  // Show notebooks loading state
  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-medium text-gray-900 mb-2">Notebooks</h1>
        </div>
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your notebooks...</p>
        </div>
      </main>
    );
  }

  // Show notebooks error if present
  if (isError && error) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-medium text-gray-900 mb-2">Notebooks</h1>
        </div>
        <div className="text-center py-16">
          <p className="text-red-600">Error loading notebooks: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-[60px]">
      <div className="mb-8">
        <h1 className="font-medium text-gray-900 mb-2 text-5xl">Notebooks</h1>
        <p className="text-gray-600">Create and manage your AI-powered research notebooks</p>
      </div>

      {hasNotebooks ? <NotebookGrid /> : <EmptyDashboard />}
    </main>
  );
};

export default Notebooks;