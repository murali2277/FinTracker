import { GoogleGenerativeAI } from "@google/generative-ai";
import Goal from '../models/Goal.js';
import Transaction from '../models/Transaction.js';

// Helper function to sleep/delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// @desc    Get AI Strategy for a specific goal
// @route   GET /api/goals/:id/strategy
// @access  Private
export const getGoalStrategy = async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id);
        if (!goal) return res.status(404).json({ message: 'Goal not found' });

        // Check if we have cached strategies (valid for 24 hours)
        const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
        const now = new Date();
        
        if (goal.cachedStrategies && 
            goal.cachedStrategies.length > 0 && 
            goal.strategiesLastGenerated &&
            (now - new Date(goal.strategiesLastGenerated)) < CACHE_DURATION_MS) {
            // Return cached strategies
            return res.json({ 
                strategies: goal.cachedStrategies,
                cached: true,
                cachedAt: goal.strategiesLastGenerated
            });
        }

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

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Use gemini-pro-latest as confirmed available
        const model = genAI.getGenerativeModel({ model: "gemini-pro-latest" });

        const prompt = `
        You are a financial advisor. The user has a goal: "${goal.title}".
        - Target Amount: ₹${goal.targetAmount}
        - Currently Saved: ₹${goal.currentAmount}
        - Remaining: ₹${goal.targetAmount - goal.currentAmount}
        - Deadline: ${goal.targetDate ? new Date(goal.targetDate).toDateString() : 'No deadline'}
        - Priority: ${goal.priority}
        
        User's Top Expenses (last 2 months): ${topExpenses || "No expense data available"}

        IMPORTANT: Provide 4 detailed, expense-focused strategies. Each strategy should:
        1. Analyze their TOP EXPENSE CATEGORIES
        2. Suggest SPECIFIC reduction targets (e.g., "Reduce Shopping by 30%")
        3. Give concrete ACTION STEPS (not generic advice)
        4. Show MONTHLY SAVINGS potential from the reduction
        
        Format as JSON array like: [
          "Strategy with specific amount and deadline",
          "Another concrete strategy with numbers",
          "Third strategy analyzing categories",
          "Fourth strategy with action plan"
        ]
        
        Make strategies DETAILED, SPECIFIC, and ACTIONABLE based on their actual spending patterns.
        Do not include markdown code blocks. Just the raw JSON array.
        `;

        // Retry logic with exponential backoff
        let strategies = [];
        let retryCount = 0;
        const MAX_RETRIES = 3;
        
        while (retryCount < MAX_RETRIES) {
            try {
                const result = await model.generateContent(prompt);
                const response = await result.response;
                let text = response.text().trim();
                
                // Clean cleanup
                text = text.replace(/```json/g, '').replace(/```/g, '').trim();

                // Safe JSON parsing
                try {
                    strategies = JSON.parse(text);
                } catch (e) {
                    // Fallback if AI returns plain text
                    strategies = [text];
                }
                
                // Success - cache the strategies
                goal.cachedStrategies = strategies;
                goal.strategiesLastGenerated = new Date();
                await goal.save();
                
                return res.json({ strategies, cached: false });
                
            } catch (apiError) {
                if (apiError.status === 429) {
                    retryCount++;
                    
                    // If we have cached strategies (even if expired), return them
                    if (goal.cachedStrategies && goal.cachedStrategies.length > 0) {
                        console.log('Rate limited, returning cached strategies');
                        return res.json({ 
                            strategies: goal.cachedStrategies,
                            cached: true,
                            message: 'AI limit reached. Showing previous suggestions.',
                            cachedAt: goal.strategiesLastGenerated
                        });
                    }
                    
                    // If we have retries left, wait and retry
                    if (retryCount < MAX_RETRIES) {
                        const delayMs = Math.pow(2, retryCount) * 1000; // Exponential backoff: 2s, 4s, 8s
                        console.log(`Rate limited, retrying in ${delayMs}ms (attempt ${retryCount}/${MAX_RETRIES})`);
                        await sleep(delayMs);
                    } else {
                        // Out of retries, return generic suggestions
                        const genericStrategies = [
                            `Save $${Math.ceil((goal.targetAmount - goal.currentAmount) / 12)} per month to reach your goal in a year`,
                            "Track your daily expenses to identify areas where you can cut back",
                            "Set up automatic transfers to your savings on payday"
                        ];
                        return res.json({ 
                            strategies: genericStrategies,
                            cached: false,
                            message: 'AI temporarily unavailable. Here are general tips.',
                            isGeneric: true
                        });
                    }
                } else {
                    throw apiError; // Re-throw non-429 errors
                }
            }
        }

    } catch (error) {
        console.error("AI Strategy Failed:", error);
        
        // Try to return cached strategies if available
        const goal = await Goal.findById(req.params.id);
        if (goal && goal.cachedStrategies && goal.cachedStrategies.length > 0) {
            return res.json({ 
                strategies: goal.cachedStrategies,
                cached: true,
                message: 'Using previous suggestions due to temporary error.',
                cachedAt: goal.strategiesLastGenerated
            });
        }
        
        // Return generic fallback strategies
        const remaining = goal ? goal.targetAmount - goal.currentAmount : 0;
        const genericStrategies = [
            remaining > 0 ? `Save $${Math.ceil(remaining / 12)} per month to reach your goal in a year` : "Great job! You've reached your goal!",
            "Review your expenses weekly and identify unnecessary spending",
            "Consider setting up automatic savings to stay on track"
        ];
        
        res.json({ 
            strategies: genericStrategies,
            isGeneric: true,
            message: 'AI service temporarily unavailable. Here are general tips.'
        });
    }
};

// @desc    Refresh/Clear cached strategies to force new generation
// @route   POST /api/goals/:id/strategy/refresh
// @access  Private
export const refreshStrategy = async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id);
        if (!goal) return res.status(404).json({ message: 'Goal not found' });
        if (goal.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Clear the cache
        goal.cachedStrategies = [];
        goal.strategiesLastGenerated = null;
        await goal.save();

        res.json({ message: 'Cache cleared. New strategies will be generated on next request.' });
    } catch (error) {
        console.error("Refresh failed:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Save a strategy as favorite/bookmark
// @route   POST /api/goals/:id/strategy/save
// @access  Private
export const saveStrategy = async (req, res) => {
    try {
        const { strategy } = req.body;
        if (!strategy) return res.status(400).json({ message: 'Strategy text required' });

        const goal = await Goal.findById(req.params.id);
        if (!goal) return res.status(404).json({ message: 'Goal not found' });
        if (goal.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Add to saved strategies if not already saved
        const alreadySaved = goal.savedStrategies.some(s => s.strategy === strategy);
        if (alreadySaved) {
            return res.status(400).json({ message: 'Strategy already saved' });
        }

        goal.savedStrategies.push({ strategy, savedAt: new Date() });
        await goal.save();

        res.json({ message: 'Strategy saved!', savedStrategies: goal.savedStrategies });
    } catch (error) {
        console.error("Save strategy failed:", error);
        res.status(500).json({ message: error.message });
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

                // Check if no savings
                if (monthsToGoal === Infinity) {
                    // Not saving any money
                    comparisonText = "Need to start saving";
                } else if (monthsToDeadline !== null) {
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

// @desc    Remove a saved strategy
// @route   POST /api/goals/:id/strategy/remove
// @access  Private
export const removeStrategy = async (req, res) => {
    try {
        const { strategy } = req.body;
        if (!strategy) return res.status(400).json({ message: 'Strategy text required' });

        const goal = await Goal.findById(req.params.id);
        if (!goal) return res.status(404).json({ message: 'Goal not found' });
        if (goal.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Remove from saved strategies
        goal.savedStrategies = goal.savedStrategies.filter(s => {
            const text = typeof s === 'string' ? s : s.strategy;
            return text !== strategy;
        });
        await goal.save();

        res.json({ message: 'Strategy removed!', savedStrategies: goal.savedStrategies });
    } catch (error) {
        console.error("Remove strategy failed:", error);
        res.status(500).json({ message: error.message });
    }
};
