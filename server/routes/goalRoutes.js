import express from 'express';
import { getGoals, createGoal, updateGoal, deleteGoal, getGoalAnalysis, getGoalStrategy } from '../controllers/goalController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/analysis', protect, getGoalAnalysis);
router.get('/:id/strategy', protect, getGoalStrategy); // Add Strategy ID Route

router.route('/')
  .get(protect, getGoals)
  .post(protect, createGoal);

router.route('/:id')
  .put(protect, updateGoal)
  .delete(protect, deleteGoal);


export default router;
