import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { Datasets } from './components/Datasets';
import { Templates } from './components/Templates';
import { Campaigns } from './components/Campaigns';
import { Layout } from './components/Layout';
import { initializeGoogleAuth, getAccessToken, setTokens, getCurrentUser } from './utils/auth';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeGoogleAuth();
        
        // Check if user is already authenticated
        const token = getAccessToken();
        if (token) {
          try {
            const currentUser = await getCurrentUser(token);
            setUser(currentUser);
            setIsAuthenticated(true);
            setTokens(token);
          } catch (error) {
            // Token invalid, clear it
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
        }
      } catch (error) {
        console.error('Failed to initialize:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  const handleLoginSuccess = (loginResult: any) => {
    setUser(loginResult.user);
    setTokens(loginResult.accessToken, loginResult.refreshToken);
    setIsAuthenticated(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            !isAuthenticated ? (
              <Login onLoginSuccess={handleLoginSuccess} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <Layout user={user}>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/datasets" element={<Datasets />} />
                  <Route path="/templates" element={<Templates />} />
                  <Route path="/campaigns" element={<Campaigns />} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

