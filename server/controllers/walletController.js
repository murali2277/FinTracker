import Wallet from '../models/Wallet.js';
import WalletTransaction from '../models/WalletTransaction.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import mongoose from 'mongoose'; 
import { categorizeWithAI } from '../utils/aiCategorizer.js'; 

// @desc    Get user wallet balance
// @route   GET /api/wallet
// @access  Private
export const getWallet = async (req, res) => {
    try {
        let wallet = await Wallet.findOne({ user: req.user._id });
        if (!wallet) {
            // Auto-create if not exists
            wallet = await Wallet.create({ user: req.user._id });
        }
        res.json(wallet);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get wallet history
// @route   GET /api/wallet/history
// @access  Private
export const getWalletHistory = async (req, res) => {
    try {
        const history = await WalletTransaction.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate('relatedUser', 'name email');
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Top up wallet (Add Money)
// @route   POST /api/wallet/topup
// @access  Private
export const topUpWallet = async (req, res) => {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
    }

    try {
        // Atomic update
        const wallet = await Wallet.findOneAndUpdate(
            { user: req.user._id },
            { $inc: { balance: amount } },
            { new: true, upsert: true }
        );

        // Record Transaction
        await WalletTransaction.create({
            wallet: wallet._id,
            user: req.user._id,
            type: 'TOPUP',
            amount: amount,
            description: 'Added money to wallet',
            status: 'SUCCESS'
        });

        // ⚠️ Integration: Add to main Budget History/Analytics
        await Transaction.create({
            user: req.user._id,
            type: 'income',
            title: 'Wallet Deposit',
            amount: amount,
            category: 'Wallet TopUp',
            date: new Date(),
            paymentMode: 'Bank Transfer',
            subType: 'Variable'
        });

        res.json(wallet);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Transfer money to another user
// @route   POST /api/wallet/transfer
// @access  Private
export const transferFunds = async (req, res) => {
    const { phone, amount, description } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
    }
    
    // Check if sending to self
    if (phone === req.user.phone) {
        return res.status(400).json({ message: 'Cannot transfer to self' });
    }

    try {
        // 1. Find Recipient (by Phone Only)
        const recipientUser = await User.findOne({ phone });

        if (!recipientUser) {
            return res.status(404).json({ message: 'Recipient with this phone number not found' });
        }

        // 2. Find Sender Wallet and Check Balance (Atomic Check & Deduct)
        const senderWallet = await Wallet.findOneAndUpdate(
            { user: req.user._id, balance: { $gte: amount } },
            { $inc: { balance: -amount } },
            { new: true }
        );

        if (!senderWallet) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        // 3. Add to Recipient (Atomic Add)
        let recipientWallet = await Wallet.findOneAndUpdate(
            { user: recipientUser._id },
            { $inc: { balance: amount } },
            { new: true, upsert: true } // Create if doesn't exist
        );

        // 4. Log Transactions for both sides
        // Sender Log
        await WalletTransaction.create({
            wallet: senderWallet._id,
            user: req.user._id,
            type: 'TRANSFER',
            amount: -amount,
            relatedUser: recipientUser._id,
            description: description || `Transferred to ${recipientUser.name}`,
            status: 'SUCCESS'
        });

        // ⚠️ Integration: Add to Sender's Budget History (Expense)
        // AI Categorization
        const aiCategory = await categorizeWithAI(req.user._id, description || `Transfer to ${recipientUser.name}`, amount);
        
        await Transaction.create({
            user: req.user._id,
            type: 'expense',
            title: `Sent to ${recipientUser.name}${description ? ' - ' + description : ''}`,
            amount: amount,
            category: aiCategory, // AI Decided Category
            date: new Date(),
            paymentMode: 'Wallet',
            subType: 'Variable'
        });

        // Recipient Log
        await WalletTransaction.create({
            wallet: recipientWallet._id,
            user: recipientUser._id,
            type: 'RECEIVED',
            amount: amount,
            relatedUser: req.user._id,
            description: `Received from ${req.user.name}`,
            status: 'SUCCESS'
        });

        // ⚠️ Integration: Add to Recipient's Budget History (Income)
        await Transaction.create({
            user: recipientUser._id,
            type: 'income',
            title: `Received from ${req.user.name}`,
            amount: amount,
            category: 'Transfer',
            date: new Date(),
            paymentMode: 'Wallet',
            subType: 'Other'
        });

        res.json({ message: 'Transfer successful', balance: senderWallet.balance });

    } catch (error) {
        console.error("Transfer Error:", error);
        res.status(500).json({ message: 'Transfer failed' });
    }
};
