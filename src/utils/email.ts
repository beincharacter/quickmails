import { getAccessToken } from './auth';

export interface EmailData {
  to: string;
  subject: string;
  body: string;
}

export const sendEmail = async (emailData: EmailData): Promise<void> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  // Build RFC 2822 email format
  const email = [
    `To: ${emailData.to}`,
    `Subject: ${emailData.subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    emailData.body,
  ].join('\r\n');

  // Encode to base64url format required by Gmail API
  const encodedEmail = btoa(unescape(encodeURIComponent(email)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodedEmail,
    }),
  });

  if (!response.ok) {
    let errorMessage = 'Failed to send email';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorMessage;
    } catch {
      const errorText = await response.text();
      if (errorText) {
        errorMessage = errorText;
      }
    }
    throw new Error(errorMessage);
  }
};

