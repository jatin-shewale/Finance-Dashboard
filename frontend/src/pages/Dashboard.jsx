import { useState, useEffect } from 'react';
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
  FiCalendar,
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { dashboardAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Card from '../components/Card.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const Dashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    fetchSummary();
  }, [dateFilter]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const params = {};
      if (dateFilter.startDate) params.startDate = dateFilter.startDate;
      if (dateFilter.endDate) params.endDate = dateFilter.endDate;

      const response = await dashboardAPI.getSummary(params);
      setSummary(response.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const cards = [
    {
      title: 'Total Income',
      value: summary?.financials?.totalIncome || 0,
      icon: FiTrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Expenses',
      value: summary?.financials?.totalExpenses || 0,
      icon: FiTrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Net Balance',
      value: summary?.financials?.netBalance || 0,
      icon: FiDollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Transactions',
      value: summary?.financials?.transactionCount || 0,
      icon: FiActivity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {user?.name}. Here's your financial overview.
        </p>
      </motion.div>

      {/* Date Filter */}
      <Card className="p-6 mb-8">
        <div className="flex flex-wrap gap-4 items-center">
          <FiCalendar className="text-gray-400" />
          <div className="flex gap-4 flex-1 flex-wrap">
            <input
              type="date"
              value={dateFilter.startDate}
              onChange={(e) =>
                setDateFilter({ ...dateFilter, startDate: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={dateFilter.endDate}
              onChange={(e) =>
                setDateFilter({ ...dateFilter, endDate: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {(dateFilter.startDate || dateFilter.endDate) && (
              <button
                onClick={() => setDateFilter({ startDate: '', endDate: '' })}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className={`text-2xl font-bold mt-2 ${card.color}`}>
                    {formatCurrency(card.value)}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${card.bgColor}`}>
                  <card.icon className={`text-xl ${card.color}`} />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Transactions */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Transactions
          </h2>
          {summary?.recentTransactions?.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No transactions yet</p>
          ) : (
            <div className="space-y-4">
              {summary?.recentTransactions?.map((txn) => (
                <div
                  key={txn._id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">{txn.category}</p>
                    <p className="text-sm text-gray-500">{txn.description || 'No description'}</p>
                    <p className="text-xs text-gray-400">{formatDate(txn.date)}</p>
                  </div>
                  <div className={`font-semibold ${txn.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {txn.type === 'income' ? '+' : '-'}
                    {formatCurrency(txn.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top Categories */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Top Categories
          </h2>
          {summary?.topCategories?.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No data available</p>
          ) : (
            <div className="space-y-4">
              {summary?.topCategories?.map((cat, index) => (
                <div key={cat._id} className="py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">
                      {index + 1}. {cat._id}
                    </span>
                    <span className={`font-semibold ${cat.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(cat.netAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{cat.transactionCount} transactions</span>
                    <span>
                      Income: {formatCurrency(cat.totalIncome)} | Expense: {formatCurrency(cat.totalExpense)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card className="p-6 mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Monthly Trends (Income vs Expenses)
        </h2>
        {summary?.monthlyTrends?.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No trend data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Income
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expenses
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {summary.monthlyTrends.map((month) => (
                  <tr key={month.month}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {month.month}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                      {formatCurrency(month.income)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                      {formatCurrency(month.expense)}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                        month.income - month.expense >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(month.income - month.expense)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
