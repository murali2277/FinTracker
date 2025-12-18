import express from 'express';
import { getReminders, createReminder, updateReminder, deleteReminder } from '../controllers/reminderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getReminders).post(protect, createReminder);
router.route('/:id').put(protect, updateReminder).delete(protect, deleteReminder);

export default router;
