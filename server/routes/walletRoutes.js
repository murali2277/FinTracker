import express from 'express';
import { getWallet, topUpWallet, transferFunds, getWalletHistory } from '../controllers/walletController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getWallet);
router.get('/history', protect, getWalletHistory);
router.post('/topup', protect, topUpWallet);
router.post('/transfer', protect, transferFunds);

export default router;
