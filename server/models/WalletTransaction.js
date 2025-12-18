import mongoose from 'mongoose';

const walletTransactionSchema = mongoose.Schema({
  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true
  },
  user: { // Redundant but useful for quick queries
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
  },
  type: {
    type: String,
    enum: ['TOPUP', 'TRANSFER', 'RECEIVED', 'DEDUCT', 'REFUND'], // DEDUCT could be for paying bills
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  relatedUser: { // For Transfers: Who sent it or who received it
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
  },
  description: {
    type: String
  },
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED'],
    default: 'SUCCESS'
  }
}, {
  timestamps: true
});

const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);

export default WalletTransaction;
