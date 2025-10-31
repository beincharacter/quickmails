import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { EmailSender } from './components/EmailSender';
import { initializeGoogleAuth } from './utils/auth';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadGoogleAuth = async () => {
      try {
        await initializeGoogleAuth();
      } catch (error) {
        console.error('Failed to initialize Google Auth:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadGoogleAuth();
  }, []);

  const handleLoginSuccess = (userData: any, _token: string) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleSignOut = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white text-lg">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen p-4">
      {!isAuthenticated ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <EmailSender userEmail={user.email} onSignOut={handleSignOut} />
      )}
    </div>
  );
}

export default App;

