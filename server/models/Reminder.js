import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
  },
  date: {
    type: Date,
    required: [true, 'Please add a date'],
  },
  amount: {
    type: Number,
  },
  type: {
    type: String,
    enum: ['income', 'expense', 'savings'],
    default: 'expense'
  },
  category: {
    type: String,
    default: 'Other'
  },
  paymentMode: {
    type: String,
    default: 'Cash'
  },
  autoAdd: {
    type: Boolean,
    default: false
  },
  completed: {
    type: Boolean,
    default: false
  },
  isProcessed: {
    type: Boolean,
    default: false, // For auto-add transactions to ensure they enter history only once
  }
}, {
  timestamps: true
});

const Reminder = mongoose.model('Reminder', reminderSchema);

export default Reminder;
