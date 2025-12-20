import Wallet from '../models/Wallet.js';
import WalletTransaction from '../models/WalletTransaction.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import mongoose from 'mongoose'; 
import { categorizeWithAI } from '../utils/aiCategorizer.js'; 
import bcrypt from 'bcryptjs';

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
        
        // Return wallet info plus pin status (without the actual pin)
        // Mongoose methods return a document, use .toObject() or extract props
        const walletData = wallet.toObject();
        delete walletData.pin; // Ensure hash is not sent
        
        res.json({ ...walletData, hasPin: !!wallet.pin });
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

// @desc    Set Wallet PIN
// @route   POST /api/wallet/pin
// @access  Private
export const setWalletPin = async (req, res) => {
    const { pin } = req.body;
    
    if (!pin || !/^\d{4,6}$/.test(pin)) {
        return res.status(400).json({ message: 'PIN must be 4-6 digits' });
    }

    try {
        const wallet = await Wallet.findOne({ user: req.user._id });
        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
        }

        if (wallet.pin) {
            return res.status(400).json({ message: 'PIN already set' });
        }

        // Hash PIN
        const salt = await bcrypt.genSalt(10);
        wallet.pin = await bcrypt.hash(pin, salt);
        await wallet.save();

        res.json({ message: 'Wallet PIN set successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Top up wallet (Add Money)
// @route   POST /api/wallet/topup
// @access  Private
export const topUpWallet = async (req, res) => {
    const { amount, pin } = req.body;
    if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
    }
    if (!pin) {
        return res.status(400).json({ message: 'PIN required' });
    }

    try {
        // Verify PIN first
        const wallet = await Wallet.findOne({ user: req.user._id });
        if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
        
        if (!wallet.pin || !(await bcrypt.compare(pin, wallet.pin))) {
            return res.status(401).json({ message: 'Invalid PIN' });
        }

        // Proceed to update balance
        wallet.balance += Number(amount);
        await wallet.save();

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
    const { phone, amount, description, pin } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
    }
    if (!pin) {
        return res.status(400).json({ message: 'PIN required' });
    }
    
    // Check if sending to self
    if (phone === req.user.phone) {
        return res.status(400).json({ message: 'Cannot transfer to self' });
    }

    try {
        // 1. Verify PIN and Balance
        const senderWallet = await Wallet.findOne({ user: req.user._id });
        if (!senderWallet) return res.status(404).json({ message: 'Wallet not found' });

        if (!senderWallet.pin || !(await bcrypt.compare(pin, senderWallet.pin))) {
            return res.status(401).json({ message: 'Invalid PIN' });
        }

        if (senderWallet.balance < amount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        // 2. Find Recipient (by Phone Only)
        const recipientUser = await User.findOne({ phone });

        if (!recipientUser) {
            return res.status(404).json({ message: 'Recipient with this phone number not found' });
        }

        // 3. Deduct from Sender
        senderWallet.balance -= Number(amount);
        await senderWallet.save();

        // 4. Add to Recipient (Atomic Add)
        let recipientWallet = await Wallet.findOneAndUpdate(
            { user: recipientUser._id },
            { $inc: { balance: amount } },
            { new: true, upsert: true } // Create if doesn't exist
        );

        // 5. Log Transactions for both sides
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
