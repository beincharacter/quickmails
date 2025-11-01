import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { Datasets } from './components/Datasets';
import { Templates } from './components/Templates';
import { Campaigns } from './components/Campaigns';
import { Layout } from './components/Layout';
import { getAccessToken, setTokens, getCurrentUser } from './utils/auth';
import './App.css';

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Check for OAuth callback from server-side OAuth flow
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const userId = urlParams.get('userId');
        const error = urlParams.get('error');

        // Handle OAuth success callback (from server-side OAuth flow)
        if (token && userId) {
          try {
            // Store token (refresh token is stored on server)
            setTokens(token, '');
            
            // Get user info from backend
            const currentUser = await getCurrentUser(token);
            setUser(currentUser);
            setIsAuthenticated(true);
            
            // Don't navigate yet - let React Router handle it
            // The route will be handled by the Routes below once isAuthenticated is true
            setIsLoading(false);
            // URL cleanup will happen automatically when component re-renders with isAuthenticated=true
            return;
          } catch (error) {
            console.error('Failed to authenticate after OAuth:', error);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            // Redirect to login on error
            window.history.replaceState({}, '', '/login?error=authentication_failed');
            setIsLoading(false);
          }
        }

        // Handle OAuth error
        if (error) {
          console.error('OAuth error:', error);
          // Clean up URL
          window.history.replaceState({}, '', '/login');
          setIsLoading(false);
          return;
        }

        // Check if user is already authenticated
        const existingToken = getAccessToken();
        if (existingToken) {
          try {
            const currentUser = await getCurrentUser(existingToken);
            setUser(currentUser);
            setIsAuthenticated(true);
            setTokens(existingToken);
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
      {isAuthenticated ? (
        <Route
          path="/*"
          element={
            <Layout user={user}>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/datasets" element={<Datasets />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/campaigns" element={<Campaigns />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          }
        />
      ) : (
        <Route path="/*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;

