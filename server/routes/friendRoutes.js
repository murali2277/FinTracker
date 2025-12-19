import express from 'express';
const router = express.Router();
import { sendFriendRequest, getFriendRequests, acceptFriendRequest, rejectFriendRequest, getFriends } from '../controllers/friendController.js';
import { protect } from '../middleware/authMiddleware.js';

router.post('/request', protect, sendFriendRequest);
router.get('/requests', protect, getFriendRequests);
router.put('/accept/:id', protect, acceptFriendRequest);
router.put('/reject/:id', protect, rejectFriendRequest);
router.get('/', protect, getFriends);

export default router;
