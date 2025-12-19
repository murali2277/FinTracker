import express from 'express';
const router = express.Router();
import { registerUser, authUser, getUsers, updateUserProfile, deleteUserAccount } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

router.post('/', registerUser);
router.get('/', getUsers);
router.post('/login', authUser);
router.route('/profile').put(protect, updateUserProfile).delete(protect, deleteUserAccount);

export default router;
