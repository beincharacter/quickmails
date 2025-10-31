import { useState } from 'react';
import { signIn } from '../utils/auth';

interface LoginProps {
  onLoginSuccess: (result: any) => void;
}

export const Login = ({ onLoginSuccess }: LoginProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signIn();
      onLoginSuccess(result);
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl p-10 shadow-2xl text-center">
          <h1 className="text-gray-800 mb-2.5 text-3xl font-semibold">Email Sender</h1>
          <p className="text-gray-600 mb-8">Sign in with Google to manage your cold email campaigns</p>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-5 text-sm">
              {error}
            </div>
          )}
          <button 
            onClick={handleLogin} 
            disabled={isLoading}
            className="w-full py-3 px-6 bg-indigo-600 text-white border-none rounded-lg text-base font-medium cursor-pointer transition-colors duration-300 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    </div>
  );
};

