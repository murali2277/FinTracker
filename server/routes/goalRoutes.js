import express from 'express';
import { getGoals, createGoal, updateGoal, deleteGoal, getGoalAnalysis, getGoalStrategy, saveStrategy, refreshStrategy, removeStrategy } from '../controllers/goalController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/analysis', protect, getGoalAnalysis);
router.get('/:id/strategy', protect, getGoalStrategy); // Get Strategy
router.post('/:id/strategy/refresh', protect, refreshStrategy); // Refresh/Clear Cache
router.post('/:id/strategy/save', protect, saveStrategy); // Save Strategy
router.post('/:id/strategy/remove', protect, removeStrategy); // Remove Strategy

router.route('/')
  .get(protect, getGoals)
  .post(protect, createGoal);

router.route('/:id')
  .put(protect, updateGoal)
  .delete(protect, deleteGoal);


export default router;
