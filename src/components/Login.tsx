import { useState } from 'react';
import { signIn, getUserInfo } from '../utils/auth';

interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export const Login = ({ onLoginSuccess }: LoginProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await signIn();
      const user = await getUserInfo(token);
      onLoginSuccess(user, token);
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-xl p-10 shadow-2xl text-center">
        <h1 className="text-gray-800 mb-2.5 text-3xl font-semibold">Email Sender</h1>
        <p className="text-gray-600 mb-8">Sign in with Google to send quick emails</p>
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-5 text-sm">
            {error}
          </div>
        )}
        <button 
          onClick={handleLogin} 
          disabled={isLoading}
          className="w-full py-3 px-6 bg-blue-500 text-white border-none rounded-lg text-base font-medium cursor-pointer transition-colors duration-300 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Signing in...' : 'Sign in with Google'}
        </button>
      </div>
    </div>
  );
};

