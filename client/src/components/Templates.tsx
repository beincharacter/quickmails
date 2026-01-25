import { useState, useEffect } from 'react';
import { apiClient } from '../config/api';
import { getAccessToken } from '../utils/auth';
import { Template, Dataset } from '../types';

export const Templates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState<{ subject: string; body: string } | null>(null);
  const [sampleData, setSampleData] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({ 
    name: '', 
    subject: '', 
    body: '', 
    datasetId: '' as string | undefined,
  });

  useEffect(() => {
    loadTemplates();
    loadDatasets();
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

  const loadDatasets = async () => {
    try {
      const token = getAccessToken();
      if (!token) return;

      const data = await apiClient.get<Dataset[]>('/datasets', token);
      setDatasets(data);
    } catch (error: any) {
      console.error('Failed to load datasets:', error);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = getAccessToken();
      if (!token) return;

      await apiClient.post('/templates', {
        ...formData,
        datasetId: formData.datasetId || undefined,
      }, token);
      setShowModal(false);
      setFormData({ name: '', subject: '', body: '', datasetId: undefined });
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

      await apiClient.put(`/templates/${selectedTemplate._id}`, {
        ...formData,
        datasetId: formData.datasetId || undefined,
      }, token);
      setShowModal(false);
      setFormData({ name: '', subject: '', body: '', datasetId: undefined });
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

  const handlePreview = async (recordIndex?: number) => {
    if (!selectedTemplate) return;

    try {
      const token = getAccessToken();
      if (!token) return;

      // If template is bound to dataset and no sample data provided, use first record
      const previewData = await apiClient.post<{ subject: string; body: string }>(
        `/templates/${selectedTemplate._id}/preview`,
        { 
          sampleData: Object.keys(sampleData).length > 0 ? sampleData : undefined,
          recordIndex: recordIndex !== undefined ? recordIndex : (selectedTemplate.datasetId ? 0 : undefined),
        },
        token
      );
      setPreviewData(previewData);
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
      datasetId: typeof template.datasetId === 'object' ? template.datasetId._id : template.datasetId || '',
    });
    setShowModal(true);
  };

  if (loading) {
    return <div className="text-center py-12">Loading templates...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Templates</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Manage your email templates with placeholders</p>
        </div>
        <button
          onClick={() => {
            setSelectedTemplate(null);
            setFormData({ name: '', subject: '', body: '', datasetId: '' });
            setShowModal(true);
          }}
          className="px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs sm:text-sm w-full sm:w-auto"
        >
          + Create Template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {templates.length === 0 ? (
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">No templates yet. Create one to get started.</p>
          </div>
        ) : (
          templates.map((template) => {
            const variables = [...new Set([...extractVariables(template.subject), ...extractVariables(template.body)])];
            
            return (
              <div key={template._id} className="bg-white rounded-lg shadow">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-3 sm:gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{template.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">{template.subject}</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => setSelectedTemplate(template)}
                        className="flex-1 sm:flex-none px-3 py-1 text-xs sm:text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template._id)}
                        className="flex-1 sm:flex-none px-3 py-1 text-xs sm:text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  {/* Show bound dataset */}
                  {template.datasetId && (
                    <div className="mb-4 p-3 bg-green-50 rounded-md border border-green-200">
                      <p className="text-xs font-medium text-green-800 mb-1">📋 Bound to Dataset:</p>
                      <p className="text-sm text-green-700">
                        {typeof template.datasetId === 'object' ? template.datasetId.name : 'Dataset'}
                      </p>
                      {template.variableMappings && (
                        <p className="text-xs text-green-600 mt-1">
                          {Object.keys(template.variableMappings).length} variables mapped
                        </p>
                      )}
                    </div>
                  )}
                  
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
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold mb-4">
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
              
              {/* Dataset Binding */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bind to Dataset (Optional)
                </label>
                <select
                  value={formData.datasetId || ''}
                  onChange={(e) => {
                    const datasetId = e.target.value || undefined;
                    setFormData({ ...formData, datasetId: datasetId || '' });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">No dataset (use manual variables)</option>
                  {datasets.map((dataset) => (
                    <option key={dataset._id} value={dataset._id}>
                      {dataset.name} ({dataset.fields?.length || 0} fields)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Bind template to a dataset to auto-map variables to dataset fields
                </p>
              </div>

              {/* Variable Mappings Display */}
              {formData.datasetId && (() => {
                const selectedDataset = datasets.find(d => d._id === formData.datasetId);
                const vars = extractVariables(formData.subject + ' ' + formData.body);
                
                if (selectedDataset && selectedDataset.fields && vars.length > 0) {
                  return (
                    <div className="mb-4 p-4 bg-blue-50 rounded-md border border-blue-200">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Variable Mappings:</h4>
                      <div className="space-y-2">
                        {vars.map((variable) => {
                          const matchingField = selectedDataset.fields?.find(
                            f => f.label.toLowerCase() === variable.toLowerCase()
                          );
                          return (
                            <div key={variable} className="flex items-center gap-2 text-sm">
                              <span className="font-mono text-blue-700">{'{'}{variable}{'}'}</span>
                              <span className="text-blue-600">→</span>
                              <span className={matchingField ? 'text-green-700 font-medium' : 'text-red-600'}>
                                {matchingField ? matchingField.label : 'No matching field'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {vars.every(v => selectedDataset.fields?.some(f => f.label.toLowerCase() === v.toLowerCase())) && (
                        <p className="text-xs text-green-700 mt-2">✅ All variables match dataset fields</p>
                      )}
                    </div>
                  );
                }
                return null;
              })()}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedTemplate(null);
                    setFormData({ name: '', subject: '', body: '', datasetId: '' });
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
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Template Preview</h2>
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
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mt-4 sm:mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-3 sm:gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{selectedTemplate.name}</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Created {new Date(selectedTemplate.createdAt).toLocaleDateString()}</p>
            </div>
            <button
              onClick={() => openEditModal(selectedTemplate)}
              className="px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs sm:text-sm w-full sm:w-auto"
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
                <div className="p-3 sm:p-4 bg-gray-50 rounded-md whitespace-pre-wrap overflow-x-auto">
                  <p className="text-gray-700 text-sm sm:text-base">{selectedTemplate.body}</p>
                </div>
            </div>
            {/* Show dataset binding info */}
            {selectedTemplate.datasetId && (
              <div className="p-4 bg-green-50 rounded-md border border-green-200">
                <h3 className="font-semibold text-green-900 mb-2">📋 Bound to Dataset:</h3>
                <p className="text-green-700 mb-2">
                  {typeof selectedTemplate.datasetId === 'object' 
                    ? selectedTemplate.datasetId.name 
                    : datasets.find(d => d._id === selectedTemplate.datasetId)?.name || 'Dataset'}
                </p>
                {selectedTemplate.variableMappings && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-green-800 mb-1">Variable Mappings:</p>
                    <div className="space-y-1">
                      {Object.entries(selectedTemplate.variableMappings).map(([variable, field]) => (
                        <div key={variable} className="text-xs text-green-700">
                          <span className="font-mono">{'{'}{variable}{'}'}</span>
                          <span className="mx-2">→</span>
                          <span className="font-medium">{field}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
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
              <h3 className="font-semibold text-gray-900 mb-2">Preview:</h3>
              {selectedTemplate.datasetId ? (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    This template is bound to a dataset. Preview will use dataset records automatically.
                  </p>
                  <button
                    onClick={() => handlePreview(0)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Preview with First Record
                  </button>
                </div>
              ) : (
                <>
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
                    onClick={() => handlePreview()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Preview Template
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

