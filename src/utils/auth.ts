import { GOOGLE_OAUTH_CONFIG, SCOPES } from '../config/oauth';
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
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google OAuth client not initialized'));
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_OAUTH_CONFIG.clientId,
      scope: SCOPES,
      callback: async (response: any) => {
        if (response.error) {
          reject(new Error(`OAuth error: ${response.error}`));
          return;
        }
        if (response.access_token) {
          accessToken = response.access_token;
          
          try {
            // Get user info
            const userInfo = await getUserInfo(response.access_token);
            
            // Note: refresh_token is only available on first auth with offline access
            // The Google Identity Services library doesn't directly support offline access
            // For production, you might need to use the full OAuth2 flow server-side
            refreshToken = response.refresh_token || '';
            
            // Store tokens on backend
            // Note: refresh_token is typically not available with client-side OAuth
            // We'll send it if present, but it may be empty
            console.log('📤 Sending tokens to backend:', {
              hasAccessToken: !!response.access_token,
              hasRefreshToken: !!response.refresh_token,
              hasUserInfo: !!userInfo,
              userEmail: userInfo?.email,
            });

            const result = await apiClient.post('/auth/store-tokens', {
              accessToken: response.access_token,
              refreshToken: response.refresh_token || '', // May be empty
              userInfo,
            });
            
            resolve({
              accessToken: response.access_token,
              refreshToken: response.refresh_token || '',
              user: result.user,
            });
          } catch (error: any) {
            reject(new Error(error.message || 'Failed to store tokens'));
          }
        } else {
          reject(new Error('Failed to get access token'));
        }
      },
      error_callback: (error: any) => {
        reject(new Error(`OAuth error: ${JSON.stringify(error)}`));
      },
    });

    if (client) {
      // Request consent to get refresh token on first auth
      client.requestAccessToken({ prompt: 'consent' });
    } else {
      reject(new Error('Failed to create OAuth client'));
    }
  });
};

export const signOut = (): void => {
  if (accessToken && window.google) {
    window.google.accounts.oauth2.revoke(accessToken, () => {
      accessToken = null;
      refreshToken = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    });
  }
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
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

