import express from 'express';
const router = express.Router();
import {
  getTransactions,
  setTransaction,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transactionController.js';
import { protect } from '../middleware/authMiddleware.js';

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Personal transaction tracking
 */

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Get all transactions for the logged in user
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of transactions
 *       401:
 *         description: Not authorized
 *   post:
 *     summary: Create a new transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - type
 *               - category
 *               - date
 *             properties:
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *       401:
 *         description: Not authorized
 */
router.route('/').get(protect, getTransactions).post(protect, setTransaction);

/**
 * @swagger
 * /transactions/{id}:
 *   put:
 *     summary: Update an existing transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transaction updated successfully
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Transaction not found
 *   delete:
 *     summary: Delete a transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction deleted successfully
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Transaction not found
 */
router.route('/:id').put(protect, updateTransaction).delete(protect, deleteTransaction);

export default router;
