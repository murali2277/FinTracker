import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import FriendRequest from '../models/FriendRequest.js';

// @desc    Send a friend request (by phone)
// @route   POST /api/friends/request
// @access  Private
const sendFriendRequest = asyncHandler(async (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        res.status(400);
        throw new Error('Phone number is required');
    }

    if (phone === req.user.phone) {
        res.status(400);
        throw new Error('Cannot add yourself as a friend');
    }

    const receiver = await User.findOne({ phone });

    if (!receiver) {
        res.status(404);
        throw new Error('User with this phone number not found');
    }

    // Check if already friends
    const sender = await User.findById(req.user._id);
    if (sender.friends.includes(receiver._id)) {
        res.status(400);
        throw new Error('Already friends');
    }

    // Check if request relationship exists (any status)
    const existingRequest = await FriendRequest.findOne({
        $or: [
            { sender: req.user._id, receiver: receiver._id },
            { sender: receiver._id, receiver: req.user._id }
        ]
    });

    if (existingRequest) {
        if (existingRequest.status === 'accepted') {
            res.status(400);
            throw new Error('You are already friends');
        } else if (existingRequest.status === 'pending') {
            res.status(400);
            throw new Error('Friend request already pending');
        } else {
            // Should theoretically be 'rejected' or logic flaw.
            // If rejected, allow re-sending by resetting this request.
            // But since index is unique on (sender, receiver), we must reuse this document or delete it.
            // NOTE: The unique index is on {sender: 1, receiver: 1}.
            // If the existing one was {sender: B, receiver: A}, and we are A sending to B,
            // the index won't block it initially, BUT logic should prevent double links.
            // Actually, if I want strict uniqueness direction-agnostic, I need more complex index.
            // But assume standard flow:
            
            // If we found a request where current user matches sender:
            if(existingRequest.sender.toString() === req.user._id.toString()){
               existingRequest.status = 'pending';
               await existingRequest.save();
               res.status(200).json({ message: 'Friend request sent again' });
               return;
            } else {
               // The other person rejected YOU, or generic state.
               // Let's just delete the old one and create new for clean state
               // Only if we can match the unique index key. 
               // If existing is A->B and we want A->B, we can update.
               // If existing is B->A and we want A->B, that's fine by index (sender,receiver) unless we enforce bidirectional uniqueness manually.
               
               // To avoid duplicate key error specifically:
               // The error `dup key: { sender: A, receiver: B }` means there is already a doc with A, B.
               // So we must be A sending to B.
               
               existingRequest.status = 'pending';
               existingRequest.sender = req.user._id; 
               existingRequest.receiver = receiver._id; // Ensure direction
               await existingRequest.save();
               res.status(200).json({ message: 'Friend request sent' });
               return;
            }
        }
    }

    const request = await FriendRequest.create({
        sender: req.user._id,
        receiver: receiver._id
    });

    res.status(201).json({ message: 'Friend request sent' });
});

// @desc    Get pending friend requests
// @route   GET /api/friends/requests
// @access  Private
const getFriendRequests = asyncHandler(async (req, res) => {
    const requests = await FriendRequest.find({
        receiver: req.user._id,
        status: 'pending'
    }).populate('sender', 'name phone email');

    res.json(requests);
});

// @desc    Accept friend request
// @route   PUT /api/friends/accept/:id
// @access  Private
const acceptFriendRequest = asyncHandler(async (req, res) => {
    const request = await FriendRequest.findById(req.params.id);

    if (!request) {
        res.status(404);
        throw new Error('Request not found');
    }

    if (request.receiver.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized');
    }

    if (request.status !== 'pending') {
        res.status(400);
        throw new Error('Request already processed');
    }

    request.status = 'accepted';
    await request.save();

    // Add to friends lists
    const sender = await User.findById(request.sender);
    const receiver = await User.findById(request.receiver);

    sender.friends.push(receiver._id);
    receiver.friends.push(sender._id);

    await sender.save();
    await receiver.save();

    res.json({ message: 'Friend request accepted' });
});

// @desc    Get all friends
// @route   GET /api/friends
// @access  Private
const getFriends = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate('friends', 'name phone email');
    res.json(user.friends);
});

// @desc    Reject friend request
// @route   PUT /api/friends/reject/:id
// @access  Private
const rejectFriendRequest = asyncHandler(async (req, res) => {
    const request = await FriendRequest.findById(req.params.id);

    if (!request) {
        res.status(404);
        throw new Error('Request not found');
    }

    if (request.receiver.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized');
    }

    if (request.status !== 'pending') {
        res.status(400);
        throw new Error('Request already processed');
    }

    request.status = 'rejected';
    await request.save();

    res.json({ message: 'Friend request rejected' });
});

export { sendFriendRequest, getFriendRequests, acceptFriendRequest, rejectFriendRequest, getFriends };
