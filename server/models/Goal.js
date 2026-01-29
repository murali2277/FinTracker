import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  title: {
    type: String,
    required: [true, 'Please add a goal title'],
    trim: true,
  },
  targetAmount: {
    type: Number,
    required: [true, 'Please add a target amount'],
  },
  currentAmount: {
    type: Number,
    default: 0,
  },
  targetDate: {
    type: Date,
  },
  description: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: '#10B981' // Default green
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'paused'],
    default: 'in_progress',
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium',
  },
  // Category for savings tracking
  category: {
    type: String,
    default: 'General Savings'
  },
  // Track savings added to this goal
  savingsHistory: [
    {
      amount: Number,
      date: { type: Date, default: Date.now },
      source: String // 'dashboard' or 'goal_update'
    }
  ],
  // AI Strategy Cache
  cachedStrategies: {
    type: [String],
    default: []
  },
  strategiesLastGenerated: {
    type: Date,
    default: null
  },
  // Saved/bookmarked strategies
  savedStrategies: [
    {
      strategy: String,
      savedAt: { type: Date, default: Date.now }
    }
  ]
}, {
  timestamps: true
});

// Calculate completion perc before saving? No, do it on frontend.

const Goal = mongoose.model('Goal', goalSchema);

export default Goal;
