import mongoose from 'mongoose';

const walletSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    required: true,
    default: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  plaidAccessToken: { // Placeholder for future real connections if needed, ignoring for now
     type: String
  },
  isLocked: {
      type: Boolean,
      default: false
  }
}, {
  timestamps: true
});

const Wallet = mongoose.model('Wallet', walletSchema);

export default Wallet;
