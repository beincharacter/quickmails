import { useState, useEffect } from 'react';
import { apiClient } from '../config/api';
import { getAccessToken } from '../utils/auth';
import { Campaign, Dataset, Template } from '../types';

export const Campaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    datasetId: '',
    templateId: '',
    selectedRecordIds: [] as string[],
    sendType: 'instant' as 'instant' | 'scheduled',
    scheduledAt: '',
    delayBetweenEmails: '',
    dailySendLimit: '',
  });
  const [selectedRecords, setSelectedRecords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = getAccessToken();
      if (!token) return;

      const [campaignsData, datasetsData, templatesData] = await Promise.all([
        apiClient.get<Campaign[]>('/campaigns', token),
        apiClient.get<Dataset[]>('/datasets', token),
        apiClient.get<Template[]>('/templates', token),
      ]);

      setCampaigns(campaignsData);
      setDatasets(datasetsData);
      setTemplates(templatesData);
    } catch (error: any) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = getAccessToken();
      if (!token) return;

      const selectedIds = Object.keys(selectedRecords).filter((id) => selectedRecords[id]);

      await apiClient.post(
        '/campaigns',
        {
          ...formData,
          selectedRecordIds: selectedIds,
          scheduledAt: formData.sendType === 'scheduled' ? formData.scheduledAt : undefined,
          delayBetweenEmails: formData.delayBetweenEmails ? parseInt(formData.delayBetweenEmails) : undefined,
          dailySendLimit: formData.dailySendLimit ? parseInt(formData.dailySendLimit) : undefined,
        },
        token
      );

      setShowModal(false);
      setFormData({
        name: '',
        datasetId: '',
        templateId: '',
        selectedRecordIds: [],
        sendType: 'instant',
        scheduledAt: '',
        delayBetweenEmails: '',
        dailySendLimit: '',
      });
      setSelectedRecords({});
      loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to create campaign');
    }
  };

  const handleStartCampaign = async (id: string) => {
    try {
      const token = getAccessToken();
      if (!token) return;

      await apiClient.post(`/campaigns/${id}/start`, {}, token);
      loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to start campaign');
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const token = getAccessToken();
      if (!token) return;

      await apiClient.delete(`/campaigns/${id}`, token);
      loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to delete campaign');
    }
  };

  const loadDatasetRecords = async (datasetId: string) => {
    try {
      const token = getAccessToken();
      if (!token) return;

      const dataset = await apiClient.get<Dataset>(`/datasets/${datasetId}`, token);
      
      // Initialize selected records
      const initialSelected: Record<string, boolean> = {};
      dataset.records.forEach((_, index) => {
        initialSelected[index.toString()] = false;
      });
      setSelectedRecords(initialSelected);
    } catch (error: any) {
      console.error('Failed to load dataset records:', error);
    }
  };

  useEffect(() => {
    if (formData.datasetId) {
      loadDatasetRecords(formData.datasetId);
    }
  }, [formData.datasetId]);

  const selectedDataset = datasets.find((d) => d._id === formData.datasetId);
  const selectedTemplate = templates.find((t) => t._id === formData.templateId);

  if (loading) {
    return <div className="text-center py-12">Loading campaigns...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600 mt-2">Create and manage your email campaigns</p>
        </div>
        <button
          onClick={() => {
            setFormData({
              name: '',
              datasetId: '',
              templateId: '',
              selectedRecordIds: [],
              sendType: 'instant',
              scheduledAt: '',
              delayBetweenEmails: '',
              dailySendLimit: '',
            });
            setSelectedRecords({});
            setShowModal(true);
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Create Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {campaigns.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">No campaigns yet. Create one to get started.</p>
          </div>
        ) : (
          campaigns.map((campaign) => {
            const dataset = typeof campaign.datasetId === 'object' ? campaign.datasetId : datasets.find((d) => d._id === campaign.datasetId);
            const template = typeof campaign.templateId === 'object' ? campaign.templateId : templates.find((t) => t._id === campaign.templateId);

            return (
              <div key={campaign._id} className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                        <span>Dataset: {dataset?.name || 'Unknown'}</span>
                        <span>•</span>
                        <span>Template: {template?.name || 'Unknown'}</span>
                        <span>•</span>
                        <span>Type: {campaign.sendType}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          campaign.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : campaign.status === 'sending'
                            ? 'bg-blue-100 text-blue-800'
                            : campaign.status === 'scheduled'
                            ? 'bg-yellow-100 text-yellow-800'
                            : campaign.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {campaign.status}
                      </span>
                      {campaign.status === 'draft' && (
                        <button
                          onClick={() => handleStartCampaign(campaign._id)}
                          className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                          Start
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteCampaign(campaign._id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Total Emails</p>
                      <p className="text-lg font-semibold text-gray-900">{campaign.totalEmails}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Sent</p>
                      <p className="text-lg font-semibold text-green-600">{campaign.sentEmails}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Failed</p>
                      <p className="text-lg font-semibold text-red-600">{campaign.failedEmails}</p>
                    </div>
                  </div>
                  {campaign.scheduledAt && (
                    <div className="mt-4 text-sm text-gray-600">
                      Scheduled for: {new Date(campaign.scheduledAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Campaign Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create Campaign</h2>
            <form onSubmit={handleCreateCampaign}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Dataset</label>
                <select
                  value={formData.datasetId}
                  onChange={(e) => setFormData({ ...formData, datasetId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select a dataset</option>
                  {datasets.map((dataset) => (
                    <option key={dataset._id} value={dataset._id}>
                      {dataset.name} ({dataset.records.length} records)
                    </option>
                  ))}
                </select>
              </div>

              {selectedDataset && (
                <div className="mb-4 p-4 bg-gray-50 rounded-md max-h-48 overflow-y-auto">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Records (leave empty to select all)
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Object.values(selectedRecords).every((v) => v)}
                        onChange={(e) => {
                          const allSelected = e.target.checked;
                          const newSelected: Record<string, boolean> = {};
                          selectedDataset.records.forEach((_, index) => {
                            newSelected[index.toString()] = allSelected;
                          });
                          setSelectedRecords(newSelected);
                        }}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">Select All</span>
                    </label>
                    {selectedDataset.records.slice(0, 50).map((record, index) => {
                      const emailField = selectedDataset.fields.find((f) => f.label.toLowerCase().includes('email'))?.label || selectedDataset.fields[0]?.label;
                      const email = record[emailField]?.toString() || `Record ${index + 1}`;
                      
                      return (
                        <label key={index} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedRecords[index.toString()] || false}
                            onChange={(e) =>
                              setSelectedRecords({ ...selectedRecords, [index.toString()]: e.target.checked })
                            }
                            className="rounded"
                          />
                          <span className="text-sm text-gray-700">{email}</span>
                        </label>
                      );
                    })}
                    {selectedDataset.records.length > 50 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Showing first 50 of {selectedDataset.records.length} records
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
                <select
                  value={formData.templateId}
                  onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select a template</option>
                  {templates.map((template) => (
                    <option key={template._id} value={template._id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Send Type</label>
                <select
                  value={formData.sendType}
                  onChange={(e) => setFormData({ ...formData, sendType: e.target.value as 'instant' | 'scheduled' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="instant">Send Instantly</option>
                  <option value="scheduled">Schedule for Later</option>
                </select>
              </div>

              {formData.sendType === 'scheduled' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required={formData.sendType === 'scheduled'}
                  />
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delay Between Emails (seconds)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.delayBetweenEmails}
                  onChange={(e) => setFormData({ ...formData, delayBetweenEmails: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., 60 (1 minute delay)"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Daily Send Limit</label>
                <input
                  type="number"
                  min="1"
                  value={formData.dailySendLimit}
                  onChange={(e) => setFormData({ ...formData, dailySendLimit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., 50 emails per day"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedRecords({});
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

