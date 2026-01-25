import { useState, useEffect } from 'react';
import { signIn } from '../utils/auth';

interface LoginProps {
  onLoginSuccess?: (result: any) => void;
}

export const Login = ({ onLoginSuccess: _onLoginSuccess }: LoginProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for error in URL params (from OAuth callback)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      // Clean up URL
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Server-side OAuth will redirect, so we don't need to wait for response
      await signIn();
      // This redirects, so we'll never reach here
    } catch (err: any) {
      setError(err.message || 'Failed to login');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl p-6 sm:p-10 shadow-2xl text-center">
          <h1 className="text-gray-800 mb-2 sm:mb-2.5 text-2xl sm:text-3xl font-semibold">MailPilot</h1>
          <div className="mb-6 sm:mb-8 space-y-3 text-left">
            <p className="text-gray-700 text-sm sm:text-base font-medium">
              Professional Email Campaign Management Platform
            </p>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              MailPilot helps you send personalized cold emails at scale. Create email campaigns, manage datasets, 
              use customizable templates, and track your email performance—all integrated with your Gmail account.
            </p>
            <ul className="text-gray-600 text-xs sm:text-sm space-y-1.5 list-disc list-inside">
              <li>Send personalized emails to multiple recipients</li>
              <li>Schedule campaigns for optimal delivery times</li>
              <li>Track email performance and engagement</li>
              <li>Manage datasets and email templates</li>
            </ul>
          </div>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 sm:mb-5 text-xs sm:text-sm">
              {error}
            </div>
          )}
          <button 
            onClick={handleLogin} 
            disabled={isLoading}
            className="w-full py-2.5 sm:py-3 px-4 sm:px-6 bg-indigo-600 text-white border-none rounded-lg text-sm sm:text-base font-medium cursor-pointer transition-colors duration-300 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed mb-4"
          >
            {isLoading ? 'Signing in...' : 'Sign in with Google'}
          </button>
          <p className="text-xs text-gray-500">
            By signing in, you agree to our{' '}
            <a 
              href="/privacy-policy" 
              className="text-indigo-600 hover:text-indigo-700 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

