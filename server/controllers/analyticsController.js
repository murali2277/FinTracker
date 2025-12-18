import Transaction from '../models/Transaction.js';
import Goal from '../models/Goal.js';
import mongoose from 'mongoose';

// @desc    Get comprehensive expense analytics
// @route   GET /api/analytics/expenses
// @access  Private
export const getExpenseAnalytics = async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Monthly Expense Breakdown (Last 6 Months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        sixMonthsAgo.setDate(1); // Start of the month

        const transactions = await Transaction.find({
            user: userId,
            date: { $gte: sixMonthsAgo },
            type: 'expense'
        });

        // Group by Month and Category
        const monthlyStats = {};
        const categoryStats = {}; 
        let totalExpense = 0;

        transactions.forEach(t => {
            const date = new Date(t.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
            
            // Monthly Total
            monthlyStats[monthKey] = (monthlyStats[monthKey] || 0) + t.amount;

            // Category Stats for Anomaly Detection (Global)
            if (!categoryStats[t.category]) {
                categoryStats[t.category] = { total: 0, count: 0, history: {} };
            }
            categoryStats[t.category].total += t.amount;
            categoryStats[t.category].count += 1;
            categoryStats[t.category].history[monthKey] = (categoryStats[t.category].history[monthKey] || 0) + t.amount;

            totalExpense += t.amount;
        });

        // 2. Identify Top Expense Categories (All time in window)
        const topCategories = Object.entries(categoryStats)
            .map(([cat, data]) => ({ category: cat, total: data.total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);

        // 3. Detect Overspending / Anomalies
        // Compare Current Month specific category vs Average of previous months
        const currentMonth = new Date();
        const currentMonthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
        
        const anomalies = [];

        Object.keys(categoryStats).forEach(cat => {
            const data = categoryStats[cat];
            const currentAmount = data.history[currentMonthKey] || 0;
            
            // Calculate average of previous months (excluding current)
            let prevTotal = 0;
            let prevMonthsCount = 0;
            
            Object.keys(data.history).forEach(mKey => {
                if (mKey !== currentMonthKey) {
                    prevTotal += data.history[mKey];
                    prevMonthsCount++;
                }
            });

            if (prevMonthsCount > 0) {
                const avgHistory = prevTotal / prevMonthsCount;
                // If current month is > 1.2x (20% more) than average, flag it
                if (currentAmount > avgHistory * 1.2 && currentAmount > 50) { // Threshold of $50 minimum to avoid noise
                    anomalies.push({
                        category: cat,
                        currentAmount,
                        averageAmount: avgHistory,
                        percentIncrease: ((currentAmount - avgHistory) / avgHistory) * 100
                    });
                }
            }
        });

        res.json({
            monthlyBreakdown: monthlyStats,
            topCategories,
            overspendingAlerts: anomalies,
            totalExpenseWindow: totalExpense
        });

    } catch (error) {
        console.error("Expense Analysis Error:", error);
        res.status(500).json({ message: "Failed to analyze expenses" });
    }
};

// @desc    Get AI-driven savings recommendations
// @route   GET /api/analytics/recommendations
// @access  Private
export const getSavingsRecommendations = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // 1. Fetch recent expenses (3 months)
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        
        const expenses = await Transaction.find({
            user: userId,
            type: 'expense',
            date: { $gte: threeMonthsAgo }
        });

        // 2. Calculate Average Monthly Spending per Category
        const categoryTotals = {};
        expenses.forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });

        const categoryAverages = [];
        Object.entries(categoryTotals).forEach(([cat, total]) => {
            categoryAverages.push({
                category: cat,
                avgMonthly: total / 3
            });
        });

        // Sort by highest spending
        categoryAverages.sort((a, b) => b.avgMonthly - a.avgMonthly);

        // 3. Fetch Goals (Prioritize High -> Medium -> Low)
        const goals = await Goal.find({ user: userId, status: 'in_progress' });
        
        // Helper to score goal priority
        const getPriorityScore = (p) => p === 'High' ? 3 : p === 'Medium' ? 2 : 1;
        goals.sort((a, b) => getPriorityScore(b.priority) - getPriorityScore(a.priority));

        const topGoal = goals[0]; // Focus recommendations on the most important goal

        // 4. Generate Recommendations
        const recommendations = [];

        categoryAverages.slice(0, 3).forEach(catData => {
            // Recommendation Logic: Suggest 15% cut on top categories
            const suggestedCut = Math.round(catData.avgMonthly * 0.15); 
            
            if (suggestedCut > 10) { // Only suggest if cut > $10
                let impact = "Increase your monthly savings.";
                
                if (topGoal) {
                    const remaining = topGoal.targetAmount - topGoal.currentAmount;
                    const monthlySavings = 500; // Placeholder: Ideally fetch real avg savings
                    // Simulating impact:
                    // If you save extra $suggestedCut, how much faster?
                    // Original months = remaining / monthlySavings
                    // New months = remaining / (monthlySavings + suggestedCut)
                    
                    // Simple text for now:
                    impact = `Allocate $${suggestedCut} to '${topGoal.title}' to reach it faster.`;
                }

                recommendations.push({
                    category: catData.category,
                    currentAvg: Math.round(catData.avgMonthly),
                    suggestedCut,
                    impact
                });
            }
        });

        res.json(recommendations);

    } catch (error) {
        console.error("Recommendation Engine Error:", error);
        res.status(500).json({ message: "Failed to generate recommendations" });
    }
};
