import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Verification from '../models/Verification.js';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js'; // Import
import Transaction from '../models/Transaction.js';
import Goal from '../models/Goal.js';
import Reminder from '../models/Reminder.js';
import Notification from '../models/Notification.js';
import Wallet from '../models/Wallet.js';
import WalletTransaction from '../models/WalletTransaction.js';
import FriendRequest from '../models/FriendRequest.js';

// Helper to generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// @desc    Send OTP for verification (Email & Phone)
// @route   POST /api/users/send-otp
// @access  Public
// @desc    Send OTP for verification (Email & Phone)
// @route   POST /api/users/send-otp
// @access  Public
const sendVerificationOTP = asyncHandler(async (req, res) => {
    const { email, phone } = req.body;

    if (!email || !phone) {
        res.status(400);
        throw new Error('Email and Phone number are required');
    }

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { phone }] });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const otp = generateOTP();

    // Store in DB (TTL handles expiry)
    // First, delete any previous incomplete attempts for this email/phone
    await Verification.deleteMany({ $or: [{ email }, { phone }] });

    await Verification.create({
        email,
        phone,
        otp
    });

    // Send Email
    try {
        const message = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <h2 style="color: #4F46E5;">FinTracker Verification</h2>
                <p>You requested a verification code for your account registration.</p>
                <div style="margin: 20px 0;">
                    <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; background: #EEF2FF; padding: 10px 20px; border-radius: 5px; color: #4F46E5;">${otp}</span>
                </div>
                <p>This code is valid for 10 minutes.</p>
                <p style="font-size: 12px; color: #888;">If you didn't request this, please ignore this email.</p>
            </div>
        `;

        await sendEmail({
            email: email,
            subject: 'Your FinTracker Verification Code',
            message: message
        });

        console.log(`[EMAIL SENT] -> OTP sent to ${email}`);
    } catch (error) {
        console.error("Email send failed details:");
        console.error("Error Message:", error.message);
        if (error.response) {
            console.error("SMTP Response:", error.response);
        }
        console.log(`[FALLBACK - EMAIL FAILED] OTP: ${otp}`);
        
        // If email fails, we shouldn't fail the whole request in DEV, but in PROD we might want to.
        // warning the user via response could be helpful
        // res.status(500); throw new Error("Email service failed");
    }

    // SIMULATE SENDING PHONE (In production, replace with Twilio)
    console.log(`[SIMULATED SMS] -> Phone OTP for ${phone}: ${otp}`);

    res.json({ message: 'OTP sent successfully to email and phone.' });
});

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password, otp } = req.body;

  if (!name || !email || !password || !phone) {
      res.status(400);
      throw new Error('Please include all fields (Name, Email, Phone, Password)');
  }

  // 1. Verify OTPs First!
  if (!otp) {
      res.status(400);
      throw new Error('Verification failed: OTP is required');
  }

  const verification = await Verification.findOne({ email, phone });

  if (!verification) {
      res.status(400);
      throw new Error('Verification session expired or invalid. Please request OTP again.');
  }

  if (verification.otp !== otp) {
      res.status(400);
      throw new Error('Invalid OTP. Please check and try again.');
  }

  // 2. Double check user existence (race condition safety)
  const userExists = await User.findOne({ 
      $or: [{ email }, { phone }] 
  });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists (email or phone)');
  }

  // 3. Create User
  const user = await User.create({
    name,
    email,
    phone,
    password,
  });

  if (user) {
    // Cleanup verification doc
    await Verification.deleteOne({ _id: verification._id });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
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
      phone: user.phone,
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

export { registerUser, authUser, getUsers, updateUserProfile, deleteUserAccount, sendVerificationOTP };
