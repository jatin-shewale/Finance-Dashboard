import { useState, useEffect } from 'react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiFilter,
  FiX,
  FiDollarSign,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { recordAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Card from '../components/Card.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import Alert from '../components/Alert.jsx';

const Records = () => {
  const { isAdmin } = useAuth();
  const [records, setRecords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const [filters, setFilters] = useState({
    type: '',
    category: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    fetchRecords();
    fetchCategories();
  }, [filters]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params = { ...filters };
      const response = await recordAPI.getAll(params);
      setRecords(response.data.data);
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await recordAPI.getCategories();
      setCategories(response.data.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 3000);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;

    try {
      await recordAPI.delete(id);
      showAlert('success', 'Record deleted successfully');
      fetchRecords();
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Failed to delete record');
    }
  };

  const openModal = (record = null) => {
    setEditingRecord(record);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRecord(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Records</h1>
          <p className="text-gray-600 mt-2">Manage your income and expenses</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => openModal()}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200"
          >
            <FiPlus /> <span>Add Record</span>
          </button>
        )}
      </motion.div>

      {/* Alert */}
      <AnimatePresence>
        {alert.message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6"
          >
            <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters */}
        <Card className="p-6 lg:w-64 flex-shrink-0">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <FiFilter /> <span>Filters</span>
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() =>
                setFilters({
                  type: '',
                  category: '',
                  startDate: '',
                  endDate: '',
                  page: 1,
                  limit: 20,
                })
              }
              className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
            >
              Clear Filters
            </button>
          </div>
        </Card>

        {/* Records List */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : records.length === 0 ? (
            <Card className="p-12 text-center">
              <FiDollarSign className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No records found</p>
              {isAdmin && (
                <button
                  onClick={() => openModal()}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Create your first record
                </button>
              )}
            </Card>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <motion.div
                  key={record._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            record.type === 'income'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {record.type}
                        </span>
                        <span className="font-medium text-gray-900">
                          {record.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {record.description || 'No description'}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDate(record.date)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <span
                        className={`text-lg font-bold ${
                          record.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {record.type === 'income' ? '+' : '-'}
                        {formatCurrency(record.amount)}
                      </span>
                      {isAdmin && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openModal(record)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleDelete(record._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingRecord ? 'Edit Record' : 'Add Record'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <FiX />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const data = {
                    amount: parseFloat(formData.get('amount')),
                    type: formData.get('type'),
                    category: formData.get('category'),
                    date: formData.get('date'),
                    description: formData.get('description'),
                  };

                  try {
                    if (editingRecord) {
                      await recordAPI.update(editingRecord._id, data);
                      showAlert('success', 'Record updated successfully');
                    } else {
                      await recordAPI.create(data);
                      showAlert('success', 'Record created successfully');
                    }
                    closeModal();
                    fetchRecords();
                  } catch (error) {
                    showAlert('error', error.response?.data?.message || 'Operation failed');
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    name="amount"
                    defaultValue={editingRecord?.amount}
                    step="0.01"
                    min="0"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    name="type"
                    defaultValue={editingRecord?.type}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    name="category"
                    defaultValue={editingRecord?.category}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Salary, Rent, Food"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    defaultValue={editingRecord?.date?.split('T')[0] || new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    defaultValue={editingRecord?.description || ''}
                    rows="3"
                    maxLength="500"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional description"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    {editingRecord ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Records;
