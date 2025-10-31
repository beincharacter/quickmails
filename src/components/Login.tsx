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
    <div className="login-container">
      <div className="login-card">
        <h1>Email Sender</h1>
        <p>Sign in with Google to send emails</p>
        {error && <div className="error-message">{error}</div>}
        <button 
          onClick={handleLogin} 
          disabled={isLoading}
          className="login-button"
        >
          {isLoading ? 'Signing in...' : 'Sign in with Google'}
        </button>
      </div>
    </div>
  );
};

