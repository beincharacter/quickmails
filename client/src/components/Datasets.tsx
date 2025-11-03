import { useState, useEffect } from 'react';
import { apiClient } from '../config/api';
import { getAccessToken } from '../utils/auth';
import { Dataset, DatasetField, DatasetRecord } from '../types';
import { addTestData } from '../utils/testData';

export const Datasets = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', fields: [] as DatasetField[], records: [] as DatasetRecord[] });
  const [newField, setNewField] = useState({ label: '', type: 'string' as const });
  const [newRecord, setNewRecord] = useState<DatasetRecord>({});
  const [isAddingTestData, setIsAddingTestData] = useState(false);

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      if (!token) {
        console.error('No access token found');
        setLoading(false);
        return;
      }

      console.log('📋 Loading datasets...');
      const data = await apiClient.get<Dataset[]>('/datasets', token);
      console.log('✅ Datasets loaded:', data);
      setDatasets(data || []);
    } catch (error: any) {
      console.error('❌ Failed to load datasets:', error);
      setDatasets([]);
      // Show user-friendly error
      alert(`Failed to load datasets: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const loadDataset = async (id: string) => {
    try {
      const token = getAccessToken();
      if (!token) return;

      const data = await apiClient.get<Dataset>(`/datasets/${id}`, token);
      setSelectedDataset(data);
    } catch (error: any) {
      console.error('Failed to load dataset:', error);
    }
  };

  const handleCreateDataset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = getAccessToken();
      if (!token) return;

      await apiClient.post('/datasets', formData, token);
      setShowModal(false);
      setFormData({ name: '', fields: [], records: [] });
      loadDatasets();
    } catch (error: any) {
      alert(error.message || 'Failed to create dataset');
    }
  };

  const handleAddField = async () => {
    if (!selectedDataset || !newField.label) return;

    try {
      const token = getAccessToken();
      if (!token) return;

      await apiClient.post(`/datasets/${selectedDataset._id}/fields`, newField, token);
      setShowAddFieldModal(false);
      setNewField({ label: '', type: 'string' });
      loadDataset(selectedDataset._id);
    } catch (error: any) {
      alert(error.message || 'Failed to add field');
    }
  };

  const handleAddRecord = async () => {
    if (!selectedDataset) return;

    try {
      const token = getAccessToken();
      if (!token) return;

      await apiClient.post(`/datasets/${selectedDataset._id}/records`, { record: newRecord }, token);
      setShowAddRecordModal(false);
      setNewRecord({});
      loadDataset(selectedDataset._id);
    } catch (error: any) {
      alert(error.message || 'Failed to add record');
    }
  };

  const handleDeleteDataset = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dataset?')) return;

    try {
      const token = getAccessToken();
      if (!token) return;

      await apiClient.delete(`/datasets/${id}`, token);
      loadDatasets();
      if (selectedDataset?._id === id) {
        setSelectedDataset(null);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to delete dataset');
    }
  };

  const handleAddTestData = async () => {
    if (!confirm('This will add 3 test datasets and 3 test templates. Continue?')) {
      return;
    }

    setIsAddingTestData(true);
    try {
      const result = await addTestData();
      alert(`✅ Test data added successfully!\n\n• ${result.datasets} datasets created\n• ${result.templates} templates created`);
      loadDatasets(); // Reload datasets to show new ones
    } catch (error: any) {
      alert(`Failed to add test data: ${error.message}`);
    } finally {
      setIsAddingTestData(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-600">Loading datasets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Datasets</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Manage your prospect datasets</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={handleAddTestData}
            disabled={isAddingTestData}
            className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
          >
            {isAddingTestData ? 'Adding...' : '+ Add Test Data'}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs sm:text-sm"
          >
            + Create Dataset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Dataset List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <h2 className="text-sm sm:text-base font-semibold text-gray-900">Your Datasets</h2>
            </div>
            <div className="p-3 sm:p-4 space-y-2 max-h-96 overflow-y-auto">
              {datasets.length === 0 ? (
                <p className="text-gray-500 text-sm">No datasets yet</p>
              ) : (
                datasets.map((dataset) => (
                  <div
                    key={dataset._id}
                    onClick={() => loadDataset(dataset._id)}
                    className={`p-2 sm:p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedDataset?._id === dataset._id
                        ? 'bg-indigo-50 border border-indigo-200'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{dataset.name}</p>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                          {dataset.fields?.length || 0} fields • {dataset.records?.length || 0} records
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDataset(dataset._id);
                        }}
                        className="text-red-600 hover:text-red-800 text-xs sm:text-sm flex-shrink-0"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Dataset View */}
        <div className="lg:col-span-2">
          {selectedDataset ? (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-2">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{selectedDataset.name}</h2>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      {selectedDataset.fields?.length || 0} fields • {selectedDataset.records?.length || 0} records
                    </p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setShowAddFieldModal(true)}
                      className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs sm:text-sm"
                    >
                      + Add Field
                    </button>
                    <button
                      onClick={() => setShowAddRecordModal(true)}
                      className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs sm:text-sm"
                    >
                      + Add Record
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-3 sm:p-6 overflow-x-auto">
                {!selectedDataset.records || selectedDataset.records.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No records yet. Add some records to get started.</p>
                ) : (
                  <div className="overflow-x-auto -mx-3 sm:mx-0">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {selectedDataset.fields?.map((field) => (
                            <th
                              key={field.label}
                              className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                            >
                              {field.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedDataset.records?.slice(0, 100).map((record, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            {selectedDataset.fields?.map((field) => (
                              <td key={field.label} className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                                {record[field.label]?.toString() || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500">Select a dataset to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Dataset Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Create Dataset</h2>
            <form onSubmit={handleCreateDataset}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Field Modal */}
      {showAddFieldModal && selectedDataset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Add Field</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Field Label</label>
              <input
                type="text"
                value={newField.label}
                onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., name, email, company"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Field Type</label>
              <select
                value={newField.type}
                onChange={(e) => setNewField({ ...newField, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="string">String</option>
                <option value="email">Email</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowAddFieldModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddField}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Add Field
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Record Modal */}
      {showAddRecordModal && selectedDataset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Add Record</h2>
            <div className="space-y-4">
              {selectedDataset.fields.map((field) => (
                <div key={field.label}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
                  <input
                    type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                    value={newRecord[field.label]?.toString() || ''}
                    onChange={(e) => setNewRecord({ ...newRecord, [field.label]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowAddRecordModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRecord}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Add Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

