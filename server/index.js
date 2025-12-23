import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import reminderRoutes from './routes/reminderRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import friendRoutes from './routes/friendRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Routes
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Health Check Endpoint for UptimeRobot
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is active' });
});

app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/friends', friendRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Start Server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
