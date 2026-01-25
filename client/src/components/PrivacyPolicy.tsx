export const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6 sm:p-8 md:p-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-sm sm:prose max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              Welcome to MailPilot ("we," "our," or "us"). We are committed to protecting your privacy and ensuring 
              you have a positive experience while using our email campaign management platform. This Privacy Policy 
              explains how we collect, use, disclose, and safeguard your information when you use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-medium text-gray-800 mt-6 mb-3">2.1 Information You Provide</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Google account information (name, email address, profile picture) when you authenticate</li>
              <li>Email datasets and recipient information you upload</li>
              <li>Email templates and campaign configurations</li>
              <li>Campaign scheduling preferences and settings</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mt-6 mb-3">2.2 Information We Automatically Collect</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Email sending logs and delivery status</li>
              <li>Campaign performance metrics</li>
              <li>Usage statistics and analytics</li>
              <li>Technical information (IP address, browser type, device information)</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mt-6 mb-3">2.3 Google OAuth Information</h3>
            <p className="text-gray-700 leading-relaxed">
              When you authenticate with Google, we receive access to your Gmail account to send emails on your behalf. 
              We store OAuth tokens (access token and refresh token) securely to maintain your session and send emails 
              as requested. We only access your Gmail account to send emails through our platform and do not read, 
              store, or analyze your personal emails.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-3">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Provide, maintain, and improve our email campaign management services</li>
              <li>Process and send email campaigns as you configure them</li>
              <li>Authenticate your account and manage your session</li>
              <li>Track email delivery status and campaign performance</li>
              <li>Send you service-related notifications and updates</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Detect, prevent, and address technical issues and security threats</li>
              <li>Comply with legal obligations and enforce our terms of service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Data Storage and Security</h2>
            <p className="text-gray-700 leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your information against 
              unauthorized access, alteration, disclosure, or destruction. Your data is stored in secure databases with 
              encryption at rest. OAuth tokens are stored securely and encrypted. However, no method of transmission 
              over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Data Sharing and Disclosure</h2>
            <p className="text-gray-700 leading-relaxed mb-3">We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Google Services:</strong> We use Google OAuth and Gmail API to send emails. Your emails are sent through your Gmail account via Google's infrastructure.</li>
              <li><strong>Service Providers:</strong> We may share information with third-party service providers who perform services on our behalf (e.g., hosting, database management, email delivery).</li>
              <li><strong>Legal Requirements:</strong> We may disclose information if required by law or in response to valid legal requests.</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Your Rights and Choices</h2>
            <p className="text-gray-700 leading-relaxed mb-3">You have the following rights regarding your information:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Access:</strong> You can access and view your account information, datasets, templates, and campaigns through our platform.</li>
              <li><strong>Deletion:</strong> You can delete your datasets, templates, and campaigns at any time. You can also request deletion of your account.</li>
              <li><strong>Revoke Access:</strong> You can revoke Google OAuth access at any time through your Google account settings or by signing out of MailPilot.</li>
              <li><strong>Data Export:</strong> You can export your data (datasets, templates, campaign logs) through our platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Third-Party Services</h2>
            <p className="text-gray-700 leading-relaxed">
              Our service integrates with Google Gmail API for email sending. Your use of Google services is subject to 
              Google's Privacy Policy and Terms of Service. We encourage you to review Google's privacy practices. 
              We are not responsible for the privacy practices of third-party services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your information for as long as your account is active or as needed to provide services. 
              Email logs and campaign data are retained to provide you with historical performance metrics. 
              You can request deletion of your account and associated data at any time, and we will delete it 
              within a reasonable timeframe, subject to legal retention requirements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Our service is not intended for individuals under the age of 18. We do not knowingly collect 
              personal information from children. If you believe we have collected information from a child, 
              please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material changes 
              by posting the new Privacy Policy on this page and updating the "Last updated" date. You are 
              advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy practices, 
              please contact us at:
            </p>
            <p className="text-gray-700 leading-relaxed mt-2">
              <strong>Email:</strong> support@mailpilot.com<br />
              <strong>Website:</strong> https://quickmails.onrender.com
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <a 
            href="/login" 
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Back to Login
          </a>
        </div>
      </div>
    </div>
  );
};
