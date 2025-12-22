import mongoose from 'mongoose';

const verificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // Documents expire after 10 minutes (600 seconds)
  },
});

const Verification = mongoose.model('Verification', verificationSchema);

export default Verification;
