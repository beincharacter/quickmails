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
  const [previewData, setPreviewData] = useState<{ subject: string; body: string } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [fullDataset, setFullDataset] = useState<Dataset | null>(null);

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

  const handleSendEmails = async () => {
    if (!formData.name || !formData.templateId || !formData.datasetId || !fullDataset) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate scheduled date/time if scheduled send type
    if (formData.sendType === 'scheduled') {
      if (!formData.scheduledAt) {
        alert('Please select a date and time for scheduled sending');
        return;
      }
      
      const scheduledDate = new Date(formData.scheduledAt);
      const now = new Date();
      if (scheduledDate <= now) {
        alert('Scheduled date and time must be in the future');
        return;
      }
    }

    // Get selected record indices (or all if none selected)
    const selectedIds = Object.keys(selectedRecords).filter((id) => selectedRecords[id]);
    const recordIdsToUse = selectedIds.length > 0 
      ? selectedIds 
      : fullDataset.records?.map((_, idx) => idx.toString()) || [];
    
    const recipientCount = recordIdsToUse.length;

    if (recipientCount === 0) {
      alert('Please select at least one record to send emails to');
      return;
    }

    const sendAction = formData.sendType === 'scheduled' 
      ? `schedule emails for ${new Date(formData.scheduledAt).toLocaleString()}`
      : `send emails to ${recipientCount} recipient${recipientCount === 1 ? '' : 's'}`;

    if (!confirm(`This will ${sendAction}. Continue?`)) {
      return;
    }

    try {
      const token = getAccessToken();
      if (!token) return;

      // Create campaign (instant or scheduled)
      await apiClient.post(
        '/campaigns',
        {
          name: formData.name,
          templateId: formData.templateId,
          datasetId: formData.datasetId,
          selectedRecordIds: recordIdsToUse,
          sendType: formData.sendType,
          scheduledAt: formData.sendType === 'scheduled' ? formData.scheduledAt : undefined,
          delayBetweenEmails: formData.delayBetweenEmails ? parseInt(formData.delayBetweenEmails) : 0,
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
      setPreviewData(null);
      setFullDataset(null);
      loadData();
      if (formData.sendType === 'scheduled') {
        const scheduledDate = new Date(formData.scheduledAt).toLocaleString();
        alert(`✅ Campaign created and scheduled!\n\n📅 Emails scheduled for: ${scheduledDate}\n📧 Will send to ${recipientCount} recipient${recipientCount === 1 ? '' : 's'}.\n\nYou can monitor progress in the campaigns list.`);
      } else {
        alert(`✅ Campaign created and started!\n\n📧 Sending emails to ${recipientCount} recipient${recipientCount === 1 ? '' : 's'}.\n\nYou can monitor progress in the campaigns list.`);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to send emails');
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    // This form is now used for step-by-step flow, submission handled by handleSendEmails
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
      setFullDataset(dataset);
      
      // Initialize selected records (all selected by default)
      const initialSelected: Record<string, boolean> = {};
      dataset.records.forEach((_, index) => {
        initialSelected[index.toString()] = true;
      });
      setSelectedRecords(initialSelected);
      
      // Auto-load preview if template is also selected
      if (formData.templateId && dataset.records.length > 0) {
        loadPreview(dataset, formData.templateId);
      }
    } catch (error: any) {
      console.error('Failed to load dataset records:', error);
    }
  };

  const loadPreview = async (dataset: Dataset, templateId: string) => {
    if (!dataset || !dataset.records || dataset.records.length === 0) return;
    
    setLoadingPreview(true);
    try {
      const token = getAccessToken();
      if (!token) return;

      // Get preview using first record from selected dataset
      const preview = await apiClient.post<{ subject: string; body: string }>(
        `/templates/${templateId}/preview`,
        { 
          recordIndex: 0,
          datasetId: dataset._id, // Use the selected dataset for preview
        },
        token
      );
      setPreviewData(preview);
    } catch (error: any) {
      console.error('Failed to load preview:', error);
      setPreviewData(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    if (formData.datasetId) {
      loadDatasetRecords(formData.datasetId);
    } else {
      setFullDataset(null);
      setPreviewData(null);
    }
  }, [formData.datasetId]);

  // Load preview when both template and dataset are selected
  useEffect(() => {
    if (formData.templateId && formData.datasetId && fullDataset && fullDataset.records && fullDataset.records.length > 0) {
      loadPreview(fullDataset, formData.templateId);
    } else if (!formData.templateId || !formData.datasetId) {
      setPreviewData(null);
    }
  }, [formData.templateId, formData.datasetId, fullDataset?._id]);

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
                  {campaign.sendType === 'scheduled' && campaign.scheduledAt && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📅</span>
                        <div>
                          <p className="text-xs font-medium text-blue-900">Scheduled Campaign</p>
                          <p className="text-sm text-blue-700">
                            {new Date(campaign.scheduledAt).toLocaleString()}
                          </p>
                          {(() => {
                            const scheduledDate = new Date(campaign.scheduledAt);
                            const now = new Date();
                            const timeDiff = scheduledDate.getTime() - now.getTime();
                            if (timeDiff > 0) {
                              const hoursUntil = Math.floor(timeDiff / (1000 * 60 * 60));
                              const minutesUntil = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                              return (
                                <p className="text-xs text-blue-600 mt-1">
                                  Starts in {hoursUntil}h {minutesUntil}m
                                </p>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
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
            <h2 className="text-xl font-bold mb-4">Send Email Campaign</h2>
            <form onSubmit={handleCreateCampaign}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  placeholder="e.g., Q1 Outreach Campaign"
                />
              </div>

              {/* Step 1: Select Template */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Step 1: Select Template
                </label>
                <select
                  value={formData.templateId}
                  onChange={(e) => {
                    setFormData({ ...formData, templateId: e.target.value });
                    setPreviewData(null); // Clear preview when template changes
                  }}
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

              {/* Step 2: Select Dataset */}
              {formData.templateId && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Step 2: Select Dataset
                  </label>
                  <select
                    value={formData.datasetId}
                    onChange={(e) => setFormData({ ...formData, datasetId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select a dataset</option>
                    {datasets.map((dataset) => (
                      <option key={dataset._id} value={dataset._id}>
                        {dataset.name} ({dataset.records?.length || 0} records)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Preview Section */}
              {formData.templateId && formData.datasetId && fullDataset && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Preview (First Record):</h3>
                  {loadingPreview ? (
                    <div className="p-4 bg-gray-50 rounded-md text-center">
                      <p className="text-gray-600">Loading preview...</p>
                    </div>
                  ) : previewData ? (
                    <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Subject:</label>
                        <p className="text-sm text-gray-900 font-medium">{previewData.subject}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Body:</label>
                        <div className="text-sm text-gray-900 whitespace-pre-wrap bg-white p-3 rounded border border-gray-200">
                          {previewData.body}
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-gray-600 border-t border-gray-200 pt-3">
                        <p className="font-medium">📊 Preview Info:</p>
                        <p>This preview uses the first record from "<strong>{fullDataset.name}</strong>"</p>
                        {(() => {
                          const selectedCount = Object.keys(selectedRecords).filter(id => selectedRecords[id]).length;
                          const totalCount = fullDataset.records?.length || 0;
                          return (
                            <>
                              <p className="mt-1">
                                📧 Will send to <strong>{selectedCount || totalCount} recipient{(selectedCount || totalCount) === 1 ? '' : 's'}</strong>
                                {selectedCount > 0 && selectedCount < totalCount && ` (${selectedCount} of ${totalCount} selected)`}
                              </p>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-yellow-50 rounded-md border border-yellow-200">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Could not load preview. Make sure the template variables match dataset fields.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Record Selection (Optional) */}
              {fullDataset && fullDataset.records && fullDataset.records.length > 0 && (
                <div className="mb-4 p-4 bg-gray-50 rounded-md max-h-48 overflow-y-auto">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Records (leave all selected to send to all)
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Object.values(selectedRecords).every((v) => v)}
                        onChange={(e) => {
                          const allSelected = e.target.checked;
                          const newSelected: Record<string, boolean> = {};
                          fullDataset.records?.forEach((_, index) => {
                            newSelected[index.toString()] = allSelected;
                          });
                          setSelectedRecords(newSelected);
                        }}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700 font-medium">
                        Select All ({fullDataset.records.length} records)
                      </span>
                    </label>
                    {fullDataset.records.slice(0, 50).map((record, index) => {
                      const emailField = fullDataset.fields?.find((f) => f.label.toLowerCase().includes('email'))?.label || fullDataset.fields?.[0]?.label;
                      const email = emailField ? record[emailField]?.toString() : `Record ${index + 1}`;
                      
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
                          <span className="text-sm text-gray-700">{email || `Record ${index + 1}`}</span>
                        </label>
                      );
                    })}
                    {fullDataset.records.length > 50 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Showing first 50 of {fullDataset.records.length} records
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Send Type Selection */}
              {formData.templateId && formData.datasetId && previewData && (
                <div className="mb-4 border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">When to Send:</h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Send Type</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="sendType"
                          value="instant"
                          checked={formData.sendType === 'instant'}
                          onChange={(e) => setFormData({ ...formData, sendType: e.target.value as 'instant' | 'scheduled', scheduledAt: '' })}
                          className="w-4 h-4 text-indigo-600"
                        />
                        <span className="text-sm text-gray-700">Send Immediately</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="sendType"
                          value="scheduled"
                          checked={formData.sendType === 'scheduled'}
                          onChange={(e) => setFormData({ ...formData, sendType: e.target.value as 'instant' | 'scheduled' })}
                          className="w-4 h-4 text-indigo-600"
                        />
                        <span className="text-sm text-gray-700">Schedule for Later</span>
                      </label>
                    </div>
                  </div>

                  {/* Scheduled Date/Time Picker */}
                  {formData.sendType === 'scheduled' && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-md border border-blue-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Schedule Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.scheduledAt}
                        onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                        min={new Date().toISOString().slice(0, 16)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required={formData.sendType === 'scheduled'}
                      />
                      <p className="text-xs text-gray-600 mt-2">
                        💡 Select a future date and time. Emails will be sent starting at this time.
                      </p>
                      {formData.scheduledAt && (() => {
                        const scheduledDate = new Date(formData.scheduledAt);
                        const now = new Date();
                        const timeDiff = scheduledDate.getTime() - now.getTime();
                        const hoursUntil = Math.floor(timeDiff / (1000 * 60 * 60));
                        const minutesUntil = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                        const daysUntil = Math.floor(hoursUntil / 24);
                        
                        if (timeDiff <= 0) {
                          return (
                            <p className="text-xs text-red-600 mt-2">
                              ⚠️ Selected time is in the past. Please choose a future time.
                            </p>
                          );
                        }
                        
                        return (
                          <p className="text-xs text-green-700 mt-2">
                            ✅ Scheduled for {scheduledDate.toLocaleString()} ({daysUntil > 0 ? `${daysUntil}d ` : ''}{hoursUntil % 24}h {minutesUntil}m from now)
                            <br />
                            <span className="text-green-600">
                              🔄 Tokens will refresh automatically - no re-authentication needed
                            </span>
                          </p>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Advanced Options */}
              {formData.templateId && formData.datasetId && previewData && (
                <div className="mb-4 border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Advanced Options (Optional):</h3>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delay Between Emails (seconds)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.delayBetweenEmails}
                      onChange={(e) => setFormData({ ...formData, delayBetweenEmails: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., 60 (1 minute delay between emails)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Recommended: 60-300 seconds to avoid spam filters
                    </p>
                  </div>

                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Daily Send Limit</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.dailySendLimit}
                      onChange={(e) => setFormData({ ...formData, dailySendLimit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., 50 emails per day"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum emails to send per day (for compliance)
                    </p>
                  </div>
                </div>
              )}

              {/* Send Button */}
              {formData.templateId && formData.datasetId && previewData && (
                <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setSelectedRecords({});
                      setPreviewData(null);
                      setFullDataset(null);
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
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSendEmails}
                    disabled={!formData.name || (formData.sendType === 'scheduled' && !formData.scheduledAt)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    {formData.sendType === 'scheduled' ? '📅 Schedule Campaign' : '✉️ Send Emails Now'}
                  </button>
                </div>
              )}

              {formData.templateId && formData.datasetId && !previewData && !loadingPreview && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-md border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Cannot send: Preview failed. Please check that template variables match dataset fields.
                  </p>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

