import { apiClient } from '../config/api';

let accessToken: string | null = null;
let refreshToken: string | null = null;

export const initializeGoogleAuth = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google?.accounts) {
      resolve();
      return;
    }

    // Wait for script to load (max 10 seconds)
    const timeout = setTimeout(() => {
      reject(new Error('Google Identity Services not loaded'));
    }, 10000);

    const checkGoogle = () => {
      if (window.google?.accounts) {
        clearTimeout(timeout);
        resolve();
      } else {
        setTimeout(checkGoogle, 100);
      }
    };

    checkGoogle();
  });
};

export const signIn = (): Promise<{ accessToken: string; refreshToken: string; user: any }> => {
  // Use server-side OAuth flow - redirect to backend OAuth endpoint
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  window.location.href = `${apiBaseUrl}/auth/google`;
  
  // This will never resolve as we're redirecting, but TypeScript needs a return
  return new Promise(() => {});
};

export const signOut = (): void => {
  // Note: We're NOT revoking the token on the server
  // This allows scheduled emails to continue working even after logout
  // Tokens remain valid on the backend for scheduled campaigns
  
  // Just clear local storage and memory
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  
  // Don't revoke tokens - they're needed for scheduled emails
  // If you want to fully revoke, you can do it manually at:
  // https://myaccount.google.com/permissions
};

export const getAccessToken = (): string | null => {
  return accessToken || localStorage.getItem('accessToken');
};

export const getRefreshToken = (): string | null => {
  return refreshToken || localStorage.getItem('refreshToken');
};

export const setTokens = (token: string, refresh?: string): void => {
  accessToken = token;
  if (refresh) {
    refreshToken = refresh;
    localStorage.setItem('refreshToken', refresh);
  }
  localStorage.setItem('accessToken', token);
};

export const getUserInfo = async (token: string): Promise<any> => {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }
  return response.json();
};

export const getCurrentUser = async (token: string): Promise<any> => {
  return apiClient.get('/auth/me', token);
};

declare global {
  interface Window {
    google: any;
  }
}

