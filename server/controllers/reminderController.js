import Reminder from '../models/Reminder.js';
import Transaction from '../models/Transaction.js';

// @desc    Get reminders
// @route   GET /api/reminders
// @access  Private
export const getReminders = async (req, res) => {
  try {
    // Optional: Trigger auto-process check here or strictly separate it.
    // Let's do a quick check for due auto-adds here for convenience, 
    // ensuring the user sees the converted transactions immediately when they check the calendar.
    await processAutoPay(req.user._id);

    const reminders = await Reminder.find({ user: req.user._id });
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create reminder
// @route   POST /api/reminders
// @access  Private
export const createReminder = async (req, res) => {
  const { title, date, amount, type, category, paymentMode, autoAdd } = req.body;

  try {
    const reminder = await Reminder.create({
      user: req.user._id,
      title,
      date,
      amount,
      type,
      category,
      paymentMode,
      autoAdd
    });
    res.status(201).json(reminder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update reminder
// @route   PUT /api/reminders/:id
// @access  Private
export const updateReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    // Check for user
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Make sure the logged in user matches the reminder user
    if (reminder.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const updatedReminder = await Reminder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedReminder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete reminder
// @route   DELETE /api/reminders/:id
// @access  Private
export const deleteReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (reminder.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await reminder.deleteOne();

    res.json({ id: req.params.id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Check for and process any due auto-add reminders
const processAutoPay = async (userId) => {
    try {
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today

        // Find unprocessed, autoAdd enabled, due date <= today
        const dueReminders = await Reminder.find({
            user: userId,
            autoAdd: true,
            isProcessed: false,
            date: { $lte: today }
        });

        for (const reminder of dueReminders) {
            // Create Transaction
            await Transaction.create({
                user: userId,
                title: reminder.title,
                amount: reminder.amount || 0,
                type: reminder.type || 'expense',
                subType: determineSubType(reminder.type), // Helper or default
                category: reminder.category || 'Other',
                paymentMode: reminder.paymentMode || 'Cash',
                date: reminder.date
            });

            // Mark reminder as processed
            reminder.isProcessed = true;
            reminder.completed = true; // Also mark visual completion
            await reminder.save();
        }
    } catch (error) {
        console.error("Auto-pay process error:", error);
    }
};

const determineSubType = (type) => {
    if (type === 'income') return 'Fixed'; // Default
    if (type === 'expense') return 'Mandatory';
    return 'Emergency Fund';
}
