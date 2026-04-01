import * as dashboardService from '../services/dashboardService.js';

/**
 * Dashboard Controller - Handles dashboard summary requests
 */

/**
 * Get dashboard summary
 */
export const getSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const summary = await dashboardService.getDashboardSummary(
      req.user._id,
      req.user.role,
      { startDate, endDate }
    );

    // Also fetch recent transactions
    const recentTransactions = await dashboardService.getRecentTransactions(
      req.user._id,
      req.user.role,
      10
    );

    // Get top categories
    const topCategories = await dashboardService.getTopCategories(
      req.user._id,
      req.user.role,
      5
    );

    // Get monthly trends
    const monthlyTrends = await dashboardService.getMonthlyTrends(
      req.user._id,
      req.user.role,
      12
    );

    res.status(200).json({
      success: true,
      data: {
        ...summary,
        recentTransactions,
        topCategories,
        monthlyTrends,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get category-wise spending summary
 */
export const getCategorySummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const categorySummary = await dashboardService.getCategoryWiseSummary(
      req.user._id,
      req.user.role,
      { startDate, endDate }
    );

    res.status(200).json({
      success: true,
      data: categorySummary,
    });
  } catch (error) {
    next(error);
  }
};
