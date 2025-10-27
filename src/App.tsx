
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CategoriesProvider } from "@/contexts/CategoriesContext";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import StickyAudioPlayer from "@/components/microcasts/StickyAudioPlayer";
import Feed from "./pages/Feed";
import Microcasts from "./pages/Microcasts";
import Podcasts from "./pages/Podcasts";
import Notebooks from "./pages/Notebooks";
import Notebook from "./pages/Notebook";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ExtensionAuth from "./pages/ExtensionAuth";
import Privacy from "./pages/Privacy";
import PendingApproval from "./pages/PendingApproval";

const queryClient = new QueryClient();

const AppContent = () => {
  return (
    <AudioPlayerProvider>
      <Routes>
        <Route 
          path="/" 
          element={
            <ProtectedRoute fallback={<Auth />}>
              <Feed />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/microcasts" 
          element={
            <ProtectedRoute fallback={<Auth />}>
              <AppLayout>
                <Microcasts />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/podcasts" 
          element={
            <ProtectedRoute fallback={<Auth />}>
              <Podcasts />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/notebooks" 
          element={
            <ProtectedRoute fallback={<Auth />}>
              <AppLayout>
                <Notebooks />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/notebook/:id" 
          element={
            <ProtectedRoute fallback={<Auth />}>
              <Notebook />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute fallback={<Auth />}>
              <AppLayout>
                <Settings />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route path="/auth" element={<Auth />} />
        <Route path="/pending-approval" element={<PendingApproval />} />
        <Route path="/extension-auth" element={<ExtensionAuth />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <StickyAudioPlayer />
    </AudioPlayerProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CategoriesProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </CategoriesProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
