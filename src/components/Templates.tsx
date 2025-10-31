import { useState, useEffect } from 'react';
import { apiClient } from '../config/api';
import { getAccessToken } from '../utils/auth';
import { Template, Dataset } from '../types';

export const Templates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState<{ subject: string; body: string } | null>(null);
  const [sampleData, setSampleData] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({ name: '', subject: '', body: '' });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const token = getAccessToken();
      if (!token) return;

      const data = await apiClient.get<Template[]>('/templates', token);
      setTemplates(data);
    } catch (error: any) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = getAccessToken();
      if (!token) return;

      await apiClient.post('/templates', formData, token);
      setShowModal(false);
      setFormData({ name: '', subject: '', body: '' });
      loadTemplates();
    } catch (error: any) {
      alert(error.message || 'Failed to create template');
    }
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      const token = getAccessToken();
      if (!token) return;

      await apiClient.put(`/templates/${selectedTemplate._id}`, formData, token);
      setShowModal(false);
      setFormData({ name: '', subject: '', body: '' });
      loadTemplates();
      setSelectedTemplate(null);
    } catch (error: any) {
      alert(error.message || 'Failed to update template');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const token = getAccessToken();
      if (!token) return;

      await apiClient.delete(`/templates/${id}`, token);
      loadTemplates();
      if (selectedTemplate?._id === id) {
        setSelectedTemplate(null);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to delete template');
    }
  };

  const handlePreview = async () => {
    if (!selectedTemplate) return;

    try {
      const token = getAccessToken();
      if (!token) return;

      const data = await apiClient.post<{ subject: string; body: string }>(
        `/templates/${selectedTemplate._id}/preview`,
        { sampleData },
        token
      );
      setPreviewData(data);
      setShowPreviewModal(true);
    } catch (error: any) {
      alert(error.message || 'Failed to preview template');
    }
  };

  const extractVariables = (text: string): string[] => {
    const regex = /\{([^}]+)\}/g;
    const variables: string[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    return variables;
  };

  const openEditModal = (template: Template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
    });
    setShowModal(true);
  };

  if (loading) {
    return <div className="text-center py-12">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
          <p className="text-gray-600 mt-2">Manage your email templates with placeholders</p>
        </div>
        <button
          onClick={() => {
            setSelectedTemplate(null);
            setFormData({ name: '', subject: '', body: '' });
            setShowModal(true);
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Create Template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {templates.length === 0 ? (
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">No templates yet. Create one to get started.</p>
          </div>
        ) : (
          templates.map((template) => {
            const variables = [...new Set([...extractVariables(template.subject), ...extractVariables(template.body)])];
            
            return (
              <div key={template._id} className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedTemplate(template)}
                        className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template._id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Variables:</h4>
                    <div className="flex flex-wrap gap-2">
                      {variables.length > 0 ? (
                        variables.map((variable) => (
                          <span
                            key={variable}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono"
                          >
                            {'{'}{variable}{'}'}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">No variables</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTemplate(template);
                      setSampleData({});
                      handlePreview();
                    }}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                  >
                    Preview Template
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Template Modal (Create/Edit) */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {selectedTemplate ? 'Edit Template' : 'Create Template'}
            </h2>
            <form onSubmit={selectedTemplate ? handleUpdateTemplate : handleCreateTemplate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  placeholder="e.g., Cold Outreach Template"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject Line</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  placeholder="e.g., Hi {name}, interested in {company}?"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {'{'}{'variable'}{'}'} for placeholders
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Body</label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={10}
                  required
                  placeholder="Hi {name},&#10;&#10;I saw you work as a {position} at {company}..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {'{'}{'variable'}{'}'} for placeholders (e.g., {'{'}{'name'}{'}'}, {'{'}{'email'}{'}'})
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedTemplate(null);
                    setFormData({ name: '', subject: '', body: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type={selectedTemplate ? 'button' : 'submit'}
                  onClick={selectedTemplate ? handleUpdateTemplate : undefined}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  {selectedTemplate ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Template Preview</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject:</label>
                <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-gray-900">{previewData.subject}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Body:</label>
                <div className="p-3 bg-gray-50 rounded-md border border-gray-200 whitespace-pre-wrap">
                  <p className="text-gray-900">{previewData.body}</p>
                </div>
              </div>
              {selectedTemplate && (
                <div className="mt-4 p-4 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> Update sample data values above and click Preview again to see different results.
                  </p>
                </div>
              )}
            </div>
            <div className="mt-6">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Template Detail View */}
      {selectedTemplate && !showModal && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedTemplate.name}</h2>
              <p className="text-gray-600 mt-1">Created {new Date(selectedTemplate.createdAt).toLocaleDateString()}</p>
            </div>
            <button
              onClick={() => openEditModal(selectedTemplate)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Edit
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Subject:</h3>
              <p className="text-gray-700">{selectedTemplate.subject}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Body:</h3>
              <div className="p-4 bg-gray-50 rounded-md whitespace-pre-wrap">
                <p className="text-gray-700">{selectedTemplate.body}</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Variables:</h3>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.variables.map((variable) => (
                  <span
                    key={variable}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded text-sm font-mono"
                  >
                    {'{'}{variable}{'}'}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-2">Preview with Sample Data:</h3>
              <div className="space-y-2 mb-4">
                {selectedTemplate.variables.map((variable) => (
                  <div key={variable}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{variable}:</label>
                    <input
                      type="text"
                      value={sampleData[variable] || ''}
                      onChange={(e) => setSampleData({ ...sampleData, [variable]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder={`Sample ${variable}`}
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={handlePreview}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Preview Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

