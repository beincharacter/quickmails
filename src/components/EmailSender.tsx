import { useState } from 'react';
import { sendEmail, EmailData } from '../utils/email';
import { signOut } from '../utils/auth';

interface EmailSenderProps {
  userEmail: string;
  onSignOut: () => void;
}

export const EmailSender = ({ userEmail, onSignOut }: EmailSenderProps) => {
  const [formData, setFormData] = useState<EmailData>({
    to: '',
    subject: '',
    body: '',
  });
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setMessage(null);
    try {
      await sendEmail(formData);
      setMessage({ type: 'success', text: 'Email sent successfully!' });
      setFormData({ to: '', subject: '', body: '' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to send email' });
    } finally {
      setIsSending(false);
    }
  };

  const handleSignOut = () => {
    signOut();
    onSignOut();
  };

  return (
    <div className="email-sender-container">
      <div className="header">
        <div>
          <h1>Send Email</h1>
          <p className="user-info">Logged in as: {userEmail}</p>
        </div>
        <button onClick={handleSignOut} className="sign-out-button">
          Sign Out
        </button>
      </div>
      <form onSubmit={handleSubmit} className="email-form">
        <div className="form-group">
          <label htmlFor="to">To:</label>
          <input
            id="to"
            type="email"
            value={formData.to}
            onChange={(e) => setFormData({ ...formData, to: e.target.value })}
            required
            placeholder="recipient@example.com"
          />
        </div>
        <div className="form-group">
          <label htmlFor="subject">Subject:</label>
          <input
            id="subject"
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
            placeholder="Email subject"
          />
        </div>
        <div className="form-group">
          <label htmlFor="body">Message:</label>
          <textarea
            id="body"
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            required
            rows={10}
            placeholder="Your message here..."
          />
        </div>
        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
        <button type="submit" disabled={isSending} className="send-button">
          {isSending ? 'Sending...' : 'Send Email'}
        </button>
      </form>
    </div>
  );
};

