// Validate that required environment variables are set
const getEnvVar = (key: string): string => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const GOOGLE_OAUTH_CONFIG = {
  clientId: getEnvVar('VITE_GOOGLE_CLIENT_ID'),
  clientSecret: getEnvVar('VITE_GOOGLE_CLIENT_SECRET'),
  projectId: getEnvVar('VITE_GOOGLE_PROJECT_ID'),
};

export const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ');

