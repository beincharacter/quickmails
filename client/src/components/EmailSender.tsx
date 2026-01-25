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
    <div className="w-full max-w-2xl bg-white rounded-xl p-8 shadow-2xl">
      <div className="flex justify-between items-center mb-8 pb-5 border-b border-gray-200">
        <div>
          <h1 className="text-gray-800 text-3xl font-semibold mb-1">Send Email</h1>
          <p className="text-gray-600 text-sm">Logged in as: {userEmail}</p>
        </div>
        <button 
          onClick={handleSignOut} 
          className="py-2 px-4 bg-red-500 text-white border-none rounded-md text-sm cursor-pointer transition-colors duration-300 hover:bg-red-600"
        >
          Sign Out
        </button>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="to" className="text-gray-800 font-medium text-sm">To:</label>
          <input
            id="to"
            type="email"
            value={formData.to}
            onChange={(e) => setFormData({ ...formData, to: e.target.value })}
            required
            placeholder="recipient@example.com"
            className="p-3 border border-gray-300 rounded-md text-sm font-inherit transition-colors duration-300 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="subject" className="text-gray-800 font-medium text-sm">Subject:</label>
          <input
            id="subject"
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
            placeholder="Email subject"
            className="p-3 border border-gray-300 rounded-md text-sm font-inherit transition-colors duration-300 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="body" className="text-gray-800 font-medium text-sm">Message:</label>
          <textarea
            id="body"
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            required
            rows={10}
            placeholder="Your message here..."
            className="p-3 border border-gray-300 rounded-md text-sm font-inherit transition-colors duration-300 focus:outline-none focus:border-indigo-500 resize-y"
          />
        </div>
        {message && (
          <div className={`p-3 rounded-md text-sm ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800' 
              : 'bg-red-50 text-red-800'
          }`}>
            {message.text}
          </div>
        )}
        <button 
          type="submit" 
          disabled={isSending} 
          className="py-3 px-6 bg-indigo-500 text-white border-none rounded-lg text-base font-medium cursor-pointer transition-colors duration-300 hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSending ? 'Sending...' : 'Send Email'}
        </button>
      </form>
    </div>
  );
};

