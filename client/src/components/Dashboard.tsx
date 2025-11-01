import { useState, useEffect } from 'react';
import { apiClient } from '../config/api';
import { getAccessToken } from '../utils/auth';
import { DashboardStats, Campaign, EmailLog } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { addTestData } from '../utils/testData';

export const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([]);
  const [recentEmails, setRecentEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingTestData, setIsAddingTestData] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const token = getAccessToken();
      if (!token) return;

      const [statsData, campaignsData, emailsData] = await Promise.all([
        apiClient.get<DashboardStats>('/dashboard/stats', token),
        apiClient.get<Campaign[]>('/dashboard/recent-campaigns?limit=5', token),
        apiClient.get<{ emails: EmailLog[] }>('/dashboard/recent-emails?limit=10', token),
      ]);

      setStats(statsData);
      setRecentCampaigns(campaignsData);
      setRecentEmails(emailsData.emails || []);
    } catch (error: any) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTestData = async () => {
    if (!confirm('This will add 3 test datasets and 3 test templates. Continue?')) {
      return;
    }

    setIsAddingTestData(true);
    try {
      const result = await addTestData();
      alert(`✅ Test data added successfully!\n\n• ${result.datasets} datasets created\n• ${result.templates} templates created\n\nRefresh the page to see them.`);
      loadDashboard(); // Reload dashboard to show new stats
    } catch (error: any) {
      alert(`Failed to add test data: ${error.message}`);
    } finally {
      setIsAddingTestData(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>;
  }

  if (!stats) {
    return <div className="text-center py-12 text-red-600">Failed to load dashboard</div>;
  }

  const statCards = [
    { label: 'Total Emails Sent', value: stats.emails.sent, color: 'bg-blue-500', icon: '📧' },
    { label: 'Scheduled Emails', value: stats.emails.scheduled, color: 'bg-yellow-500', icon: '⏰' },
    { label: 'Failed Emails', value: stats.emails.failed, color: 'bg-red-500', icon: '❌' },
    { label: 'Active Campaigns', value: stats.campaigns.active, color: 'bg-green-500', icon: '🚀' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Overview of your email campaigns</p>
        </div>
        <button
          onClick={handleAddTestData}
          disabled={isAddingTestData}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isAddingTestData ? 'Adding...' : '+ Add Test Data'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
              </div>
              <div className={`${card.color} rounded-full p-3 text-2xl`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Campaigns</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.campaigns.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">Datasets</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.datasets}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">Templates</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.templates}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Campaigns */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Campaigns</h2>
          </div>
          <div className="p-6">
            {recentCampaigns.length === 0 ? (
              <p className="text-gray-500 text-sm">No campaigns yet</p>
            ) : (
              <div className="space-y-4">
                {recentCampaigns.map((campaign) => (
                  <div key={campaign._id} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{campaign.name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {typeof campaign.datasetId === 'object' ? campaign.datasetId.name : 'Dataset'}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        campaign.status === 'completed' ? 'bg-green-100 text-green-800' :
                        campaign.status === 'sending' ? 'bg-blue-100 text-blue-800' :
                        campaign.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {campaign.sentEmails} sent / {campaign.totalEmails} total
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Emails */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Emails</h2>
          </div>
          <div className="p-6">
            {recentEmails.length === 0 ? (
              <p className="text-gray-500 text-sm">No emails yet</p>
            ) : (
              <div className="space-y-4">
                {recentEmails.map((email) => (
                  <div key={email._id} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{email.to}</p>
                        <p className="text-sm text-gray-600 truncate mt-1">{email.subject}</p>
                      </div>
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                        email.status === 'sent' ? 'bg-green-100 text-green-800' :
                        email.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {email.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(email.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

