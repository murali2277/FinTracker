import express from 'express';
const router = express.Router();
import { registerUser, authUser, getUsers } from '../controllers/userController.js';

router.post('/', registerUser);
router.get('/', getUsers);
router.post('/login', authUser);

export default router;
