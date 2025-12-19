import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import Transaction from '../models/Transaction.js';
import Goal from '../models/Goal.js';
import Reminder from '../models/Reminder.js';
import Notification from '../models/Notification.js';
import Wallet from '../models/Wallet.js';
import WalletTransaction from '../models/WalletTransaction.js';
import FriendRequest from '../models/FriendRequest.js';

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !password || !phone) {
      res.status(400);
      throw new Error('Please include all fields (Name, Email, Phone, Password)');
  }

  const userExists = await User.findOne({ 
      $or: [{ email }, { phone }] 
  });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists (email or phone)');
  }

  const user = await User.create({
    name,
    email,
    phone,
    password,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Public (for testing)
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    
    // Only allow setting phone number if it doesn't exist yet
    if (req.body.phone) {
        if (!user.phone) {
             // Check uniqueness
             const phoneExists = await User.findOne({ phone: req.body.phone });
             if(phoneExists) {
                 res.status(400);
                 throw new Error('Phone number already in use');
             }
             user.phone = req.body.phone;
        } else if (user.phone !== req.body.phone) {
             res.status(400);
             throw new Error('Phone number cannot be modified once set');
        }
    }

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Delete user account and all data
// @route   DELETE /api/users/profile
// @access  Private
const deleteUserAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password'); // Need password field

  if (!user) {
      res.status(404);
      throw new Error('User not found');
  }

  const { password } = req.body;
  if (!password) {
      res.status(400);
      throw new Error('Password is required to delete account');
  }

  if (!(await user.matchPassword(password))) {
      res.status(401);
      throw new Error('Invalid password');
  }

  if (user) {
    // 1. Delete all related data
    await Transaction.deleteMany({ user: user._id });
    await Goal.deleteMany({ user: user._id });
    await Reminder.deleteMany({ user: user._id });
    await Notification.deleteMany({ user: user._id });
    await Wallet.deleteOne({ user: user._id });
    // Delete wallet transactions where this user was involved
    await WalletTransaction.deleteMany({ user: user._id });
    
    // 2. Cleanup Friend Relations
    await FriendRequest.deleteMany({ 
        $or: [{ sender: user._id }, { receiver: user._id }] 
    });

    await User.updateMany(
        { friends: user._id },
        { $pull: { friends: user._id } }
    );

    // 3. Delete User
    await User.deleteOne({ _id: user._id });

    res.json({ message: 'User account deleted successfully' });
  }
});

export { registerUser, authUser, getUsers, updateUserProfile, deleteUserAccount };
