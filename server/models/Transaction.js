import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  type: {
    type: String, // 'income', 'expense', 'savings'
    required: [true, 'Please add a type'],
    enum: ['income', 'expense', 'savings']
  },
  subType: {
    type: String, // 'Fixed', 'Mandatory', etc.
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a description/title'],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, 'Please add an amount'],
  },
  date: {
    type: Date,
    required: [true, 'Please add a date'],
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
  },
  paymentMode: {
    type: String,
    required: [true, 'Please add a payment mode'],
  }
}, {
  timestamps: true
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
