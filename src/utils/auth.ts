import { GOOGLE_OAUTH_CONFIG, SCOPES } from '../config/oauth';

let accessToken: string | null = null;

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

export const signIn = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google OAuth client not initialized'));
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_OAUTH_CONFIG.clientId,
      scope: SCOPES,
      callback: (response: any) => {
        if (response.error) {
          reject(new Error(`OAuth error: ${response.error}`));
          return;
        }
        if (response.access_token) {
          accessToken = response.access_token;
          resolve(response.access_token);
        } else {
          reject(new Error('Failed to get access token'));
        }
      },
      error_callback: (error: any) => {
        reject(new Error(`OAuth error: ${JSON.stringify(error)}`));
      },
    });

    if (client) {
      client.requestAccessToken();
    } else {
      reject(new Error('Failed to create OAuth client'));
    }
  });
};

export const signOut = (): void => {
  if (accessToken && window.google) {
    window.google.accounts.oauth2.revoke(accessToken, () => {
      accessToken = null;
    });
  }
  accessToken = null;
};

export const getAccessToken = (): string | null => {
  return accessToken;
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

declare global {
  interface Window {
    google: any;
  }
}

