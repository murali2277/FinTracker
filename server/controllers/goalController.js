import { GoogleGenerativeAI } from "@google/generative-ai";
import Goal from '../models/Goal.js';
import Transaction from '../models/Transaction.js';

// @desc    Get AI Strategy for a specific goal
// @route   GET /api/goals/:id/strategy
// @access  Private
export const getGoalStrategy = async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id);
        if (!goal) return res.status(404).json({ message: 'Goal not found' });

        // Context: Get recent spending habits for better advice
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 2);
        
        // Quick Aggregation for context
        const expenses = await Transaction.aggregate([
            { $match: { user: req.user._id, type: 'expense', date: { $gte: threeMonthsAgo } } },
            { $group: { _id: "$category", total: { $sum: "$amount" } } },
            { $sort: { total: -1 } },
            { $limit: 3 }
        ]);

        const topExpenses = expenses.map(e => `${e._id} ($${e.total})`).join(', ');

        // AI Generation
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Use gemini-pro as it is more widely supported currently
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `
        You are a financial advisor. The user has a goal: "${goal.title}".
        - Target: $${goal.targetAmount}
        - Saved: $${goal.currentAmount}
        - Deadline: ${goal.targetDate ? new Date(goal.targetDate).toDateString() : 'None'}
        - Priority: ${goal.priority}
        
        User's Top Expenses (last 2 months): ${topExpenses || "No recent data"}

        Task: Provide 3 short, specific, and actionable strategies to reach this goal faster. 
        Focus on cutting down the specific top expenses mentioned if relevant.
        return as a JSON array of strings e.g. ["Strategy 1", "Strategy 2", "Strategy 3"].
        Do not include markdown code blocks. Just the raw JSON.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text().trim();
        
        // Clean cleanup
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        // Safe JSON parsing
        try {
             res.json({ strategies: JSON.parse(text) });
        } catch (e) {
             // Fallback if AI returns plain text
             res.json({ strategies: [text] });
        }

    } catch (error) {
        console.error("AI Strategy Failed:", error);
        res.status(500).json({ message: "Could not generate strategy" });
    }
};

// @desc    Get user goals
// @route   GET /api/goals
// @access  Private
export const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new financial goal
// @route   POST /api/goals
// @access  Private
export const createGoal = async (req, res) => {
  const { title, targetAmount, targetDate, description, color, currentAmount, priority } = req.body;

  try {
    const goal = await Goal.create({
      user: req.user._id,
      title,
      targetAmount,
      targetDate,
      description,
      color,
      currentAmount: currentAmount || 0,
      priority: priority || 'Medium'
    });
    res.status(201).json(goal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

import Notification from '../models/Notification.js';

// ... (other controllers)

// @desc    Update goal (add funds or edit details)
// @route   PUT /api/goals/:id
// @access  Private
export const updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);

    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    if (goal.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

    const updatedGoal = await Goal.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // Notification Logic
    // 1. Completion
    if (updatedGoal.currentAmount >= updatedGoal.targetAmount && goal.status !== 'completed') {
        const remaining = updatedGoal.targetAmount - updatedGoal.currentAmount; // Should be <= 0
        if(remaining <= 0) {
            await Notification.create({
                user: req.user._id,
                type: 'success',
                message: `🎉 Congratulations! You have reached your goal '${updatedGoal.title}'!`,
                relatedId: updatedGoal._id
            });
            // Auto-mark completed? Maybe leave to user or auto-update status if logic allows
        }
    }

    // 2. Approaching (90%)
    const previousPercent = (goal.currentAmount / goal.targetAmount) * 100;
    const currentPercent = (updatedGoal.currentAmount / updatedGoal.targetAmount) * 100;
    
    if (previousPercent < 90 && currentPercent >= 90 && currentPercent < 100) {
        await Notification.create({
             user: req.user._id,
             type: 'info',
             message: `Almost there! You are 90% of the way to '${updatedGoal.title}'. Keep going!`,
             relatedId: updatedGoal._id
        });
    }

    res.json(updatedGoal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete goal
// @route   DELETE /api/goals/:id
// @access  Private
export const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);

    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    if (goal.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

    await goal.deleteOne();
    res.json({ id: req.params.id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Analyze goals against spending habits
// @route   GET /api/goals/analysis
// @access  Private
// @desc    Analyze goals against spending habits
// @route   GET /api/goals/analysis
// @access  Private
export const getGoalAnalysis = async (req, res) => {
    try {
        // 1. Calculate Average Monthly Savings (Last 3 months)
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const transactions = await Transaction.find({
            user: req.user._id,
            date: { $gte: threeMonthsAgo }
        });

        let totalIncome = 0;
        let totalExpense = 0;
        const categoryMap = {};

        transactions.forEach(t => {
            if(t.type === 'income') totalIncome += t.amount;
            if(t.type === 'expense') {
                totalExpense += t.amount;
                // Track category spending
                categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
            }
        });

        const avgMonthlySavings = Math.max(0, (totalIncome - totalExpense) / 3); // Ensure non-negative for projection

        // 2. Suggest "Cutbacks" (Top 3 expense categories)
        const topExpenses = Object.entries(categoryMap)
            .sort((a, b) => b[1] - a[1]) // Sort desc by amount
            .slice(0, 3)
            .map(([cat, amount]) => ({ category: cat, monthlyAvg: amount / 3 }));

        // 3. For each Active goal, calculate time to completion
        const goals = await Goal.find({ user: req.user._id, status: 'in_progress' });
        
        const goalProjections = goals.map(goal => {
            const remaining = goal.targetAmount - goal.currentAmount;
            if (remaining <= 0) return { ...goal._doc, monthsToGoal: 0, comparisonText: "Completed", scenarios: [] };
            
            // Time if using 100% of savings
            const monthsToGoal = avgMonthlySavings > 0 ? (remaining / avgMonthlySavings) : Infinity;
            
            // Deadline Calculation
            let requiredMonthly = 0;
            let comparisonText = "No deadline set";
            let monthsToDeadline = null;

            if (goal.targetDate) {
                const now = new Date();
                const target = new Date(goal.targetDate);
                monthsToDeadline = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
                
                if (monthsToDeadline > 0) requiredMonthly = remaining / monthsToDeadline;

                if (monthsToGoal !== Infinity && monthsToDeadline !== null) {
                    const diff = monthsToDeadline - monthsToGoal;
                    if (diff >= 1) {
                        comparisonText = `${Math.floor(diff)} mo earlier than deadline`;
                    } else if (diff <= -1) {
                         comparisonText = `${Math.abs(Math.floor(diff))} mo late`;
                    } else {
                        comparisonText = "On time";
                    }
                }
            }

            // Scenarios (Simulation)
            const scenarios = [
                { label: "Current Rate", amount: avgMonthlySavings, months: monthsToGoal },
                { label: "+10% Savings", amount: avgMonthlySavings * 1.1, months: remaining / (avgMonthlySavings * 1.1) },
                { label: "+20% Savings", amount: avgMonthlySavings * 1.2, months: remaining / (avgMonthlySavings * 1.2) }
            ];

            return {
                id: goal._id,
                title: goal.title,
                remaining,
                monthsToGoal: monthsToGoal === Infinity ? 'Infinity' : monthsToGoal.toFixed(1),
                requiredMonthly: requiredMonthly.toFixed(0),
                comparisonText,
                scenarios: scenarios.map(s => ({
                    ...s,
                    months: s.months === Infinity ? 'Never' : s.months.toFixed(1)
                }))
            };
        });

        res.json({
            avgMonthlySavings: avgMonthlySavings.toFixed(0),
            topExpenses,
            goalProjections
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Analysis failed" });
    }
}
