import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock, LogOut, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const PendingApproval = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [approved, setApproved] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleCheckStatus = async () => {
    if (!user?.id) return;
    
    setChecking(true);
    
    try {
      // Fetch the latest profile data
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('admin_approval')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking approval status:', error);
        setChecking(false);
        return;
      }

      if (profile?.admin_approval === true) {
        // User is approved! Show success message and redirect
        setApproved(true);
        
        // Start countdown
        let count = 3;
        const timer = setInterval(() => {
          count -= 1;
          setCountdown(count);
          
          if (count <= 0) {
            clearInterval(timer);
            // Force reload to update AuthContext, then navigate
            window.location.href = '/';
          }
        }, 1000);
      } else {
        // Still not approved, just reset the checking state
        setChecking(false);
      }
    } catch (err) {
      console.error('Unexpected error checking status:', err);
      setChecking(false);
    }
  };

  // Show success state if approved
  if (approved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4">
        <Card className="max-w-md w-full p-8 space-y-6 shadow-xl">
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Success Icon */}
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>

            {/* Success Title */}
            <h1 className="text-2xl font-bold text-green-600">
              Account Approved! 🎉
            </h1>

            {/* Success Message */}
            <div className="space-y-3 text-gray-600">
              <p className="text-lg">
                Your account has been approved by an administrator.
              </p>
              <p>
                You now have full access to all features!
              </p>
            </div>

            {/* Countdown */}
            <div className="pt-4">
              <p className="text-sm text-gray-500">
                Redirecting to feed in {countdown} second{countdown !== 1 ? 's' : ''}...
              </p>
              <div className="w-12 h-12 mx-auto mt-3 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-white text-xl font-bold">{countdown}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Show pending state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="max-w-md w-full p-8 space-y-6 shadow-xl">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900">
            Account Pending Approval
          </h1>

          {/* Description */}
          <div className="space-y-3 text-gray-600">
            <p>
              Thank you for signing up! Your account is currently under review.
            </p>
            <p>
              An administrator will review and approve your account shortly. You'll be able to access the application once your account has been approved.
            </p>
            {user?.email && (
              <p className="text-sm text-gray-500 mt-4">
                Account: <span className="font-medium">{user.email}</span>
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 w-full pt-4">
            <Button
              onClick={handleCheckStatus}
              variant="default"
              className="flex-1"
              disabled={checking}
            >
              {checking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                'Check Status'
              )}
            </Button>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="flex-1"
              disabled={checking}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Additional Info */}
          <div className="pt-4 border-t border-gray-200 w-full">
            <p className="text-xs text-gray-500">
              If you have any questions or believe this is an error, please contact the administrator.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PendingApproval;

