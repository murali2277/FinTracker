import express from 'express';
import { getExpenseAnalytics, getSavingsRecommendations } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/expenses', protect, getExpenseAnalytics);
router.get('/recommendations', protect, getSavingsRecommendations);

export default router;
