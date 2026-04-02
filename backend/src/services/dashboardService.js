import FinancialRecord from '../models/FinancialRecord.js';
import { filterRecordsByPermission } from '../policies/financialRecordPolicy.js';


export const getDashboardSummary = async (userId, userRole, filters = {}) => {
  const { startDate, endDate } = filters;

  // Build base query
  let matchStage = { isDeleted: false };

  // Apply permission filter
  let query = FinancialRecord.find(matchStage);
  query = await filterRecordsByPermission(query, userId, userRole);

  // Apply date range filter
  if (startDate || endDate) {
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    matchStage.date = dateFilter;
  }

  return await FinancialRecord.aggregate([
    // Match stage - filter records
    { $match: matchStage },

    // Group by type to get totals
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]).exec().then((typeAggregations) => {
    // Calculate totals from type aggregations
    let totalIncome = 0;
    let totalExpenses = 0;
    let transactionCount = 0;

    typeAggregations.forEach((item) => {
      if (item._id === 'income') {
        totalIncome = item.totalAmount;
      } else if (item._id === 'expense') {
        totalExpenses = item.totalAmount;
      }
      transactionCount += item.count;
    });

    const netBalance = totalIncome - totalExpenses;

    return {
      financials: {
        totalIncome,
        totalExpenses,
        netBalance,
        transactionCount,
      },
    };
  });
};

/**
 * Get category-wise aggregation
 */
export const getCategoryWiseSummary = async (userId, userRole, filters = {}) => {
  const { startDate, endDate } = filters;

  let matchStage = { isDeleted: false, type: 'expense' };

  // Apply permission filter
  let query = FinancialRecord.find(matchStage);
  query = await filterRecordsByPermission(query, userId, userRole);

  // Apply date range filter
  if (startDate || endDate) {
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    matchStage.date = dateFilter;
  }

  return await FinancialRecord.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' },
      },
    },
    {
      $sort: { totalAmount: -1 },
    },
    {
      $limit: 10,
    },
  ]).exec();
};

/**
 * Get recent transactions
 */
export const getRecentTransactions = async (userId, userRole, limit = 10) => {
  let query = FinancialRecord.find({ isDeleted: false });
  query = await filterRecordsByPermission(query, userId, userRole);

  return await query
    .sort({ date: -1, createdAt: -1 })
    .limit(parseInt(limit))
    .lean();
};

/**
 * Get monthly trends (for line chart)
 */
export const getMonthlyTrends = async (userId, userRole, months = 12) => {
  const matchStage = { isDeleted: false };

  // Apply permission filter
  let query = FinancialRecord.find(matchStage);
  query = await filterRecordsByPermission(query, userId, userRole);

  // Calculate date range for last N months
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - parseInt(months));
  startDate.setDate(1); // Start from the 1st of the month
  startDate.setHours(0, 0, 0, 0);

  matchStage.date = { $gte: startDate, $lte: endDate };

  return await FinancialRecord.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          type: '$type',
        },
        totalAmount: { $sum: '$amount' },
      },
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 },
    },
  ]).exec().then((results) => {
    // Transform data into format suitable for charts
    const monthlyData = {};

    results.forEach((item) => {
      const { year, month, type } = item._id;
      const key = `${year}-${month.toString().padStart(2, '0')}`;

      if (!monthlyData[key]) {
        monthlyData[key] = {
          month: key,
          income: 0,
          expense: 0,
        };
      }

      monthlyData[key][type] = item.totalAmount;
    });

    // Convert to array and fill in missing months
    const filledData = [];
    const currentDate = new Date(startDate);
    const endDateMonth = endDate.getMonth();
    const endDateYear = endDate.getFullYear();

    while (
      currentDate.getFullYear() < endDateYear ||
      (currentDate.getFullYear() === endDateYear &&
        currentDate.getMonth() <= endDateMonth)
    ) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const key = `${year}-${(month + 1).toString().padStart(2, '0')}`;

      if (!monthlyData[key]) {
        monthlyData[key] = {
          month: key,
          income: 0,
          expense: 0,
        };
      }

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Sort by month
    Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .forEach((item) => {
        filledData.push(item);
      });

    return filledData;
  });
};

/**
 * Get top categories
 */
export const getTopCategories = async (userId, userRole, limit = 5) => {
  let matchStage = { isDeleted: false };

  // Apply permission filter
  let query = FinancialRecord.find(matchStage);
  query = await filterRecordsByPermission(query, userId, userRole);

  return await FinancialRecord.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$category',
        totalIncome: {
          $sum: {
            $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0],
          },
        },
        totalExpense: {
          $sum: {
            $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0],
          },
        },
        netAmount: { $sum: '$amount' },
        transactionCount: { $sum: 1 },
      },
    },
    {
      $sort: { netAmount: -1 },
    },
    {
      $limit: parseInt(limit),
    },
  ]).exec();
};
