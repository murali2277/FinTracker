import asyncHandler from 'express-async-handler';
import Transaction from '../models/Transaction.js';

// @desc    Get user transactions
// @route   GET /api/transactions
// @access  Private
const getTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ user: req.user.id }).sort({ date: -1, createdAt: -1 });
  res.status(200).json(transactions);
});

import Notification from '../models/Notification.js';
import { categorizeWithAI } from '../utils/aiCategorizer.js';

// ... (existing imports)

// @desc    Set transaction
// @route   POST /api/transactions
// @access  Private
const setTransaction = asyncHandler(async (req, res) => {
  if (!req.body.title || !req.body.amount) {
    res.status(400);
    throw new Error('Please add text and amount fields');
  }

  // AI Auto-Categorization Logic
  let category = req.body.category;
  if (!category || category === 'Uncategorized') {
      // Pass userId to fetch history for "fine-tuning" context
      category = await categorizeWithAI(req.user.id, req.body.title, req.body.amount);
  }

  const transaction = await Transaction.create({
    user: req.user.id,
    type: req.body.type,
    subType: req.body.subType,
    title: req.body.title,
    amount: req.body.amount,
    date: req.body.date,
    category: category,
    paymentMode: req.body.paymentMode
  });

  // Check Overspending (Naive Limit: 5000 per category)
  // Ideally, this should come from a Budget model
  if (req.body.type === 'expense') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      
      const transactions = await Transaction.find({
          user: req.user.id,
          type: 'expense',
          category: req.body.category,
          date: { $gte: startOfMonth }
      });

      const totalSpent = transactions.reduce((acc, t) => acc + t.amount, 0);

      // Warning Threshold (Softcode to 5000 for demo)
      if (totalSpent > 10000) {
          // Check if notification already sent today? (Skip for simplicity)
           await Notification.create({
              user: req.user._id,
              type: 'warning',
              message: `You overspent on ${req.body.category} this month (Total: $${totalSpent})`,
              relatedId: transaction._id
          });
      }
  }

  res.status(200).json(transaction);
});

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id);

  if (!transaction) {
    res.status(404);
    throw new Error('Transaction not found');
  }

  // Check for user
  if (!req.user) {
    res.status(401);
    throw new Error('User not found');
  }

  // Make sure the logged in user matches the transaction user
  if (transaction.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('User not authorized');
  }

  const updatedTransaction = await Transaction.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.status(200).json(updatedTransaction);
});

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id);

  if (!transaction) {
    res.status(404);
    throw new Error('Transaction not found');
  }

  // Check for user
  if (!req.user) {
    res.status(401);
    throw new Error('User not found');
  }

  // Make sure the logged in user matches the transaction user
  if (transaction.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('User not authorized');
  }

  // Protected: Cannot delete Wallet Transactions manually
  if (transaction.paymentMode === 'Wallet' || transaction.category === 'Wallet TopUp') {
    res.status(400);
    throw new Error('Cannot delete wallet transactions. Please use the Wallet system.');
  }

  await transaction.deleteOne();

  res.status(200).json({ id: req.params.id });
});

export {
  getTransactions,
  setTransaction,
  updateTransaction,
  deleteTransaction,
};
