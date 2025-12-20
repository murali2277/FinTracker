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
            // Self-healing: If request is accepted but users aren't linked (passed line 30 check), fix it.
            // We know 'sender' (me) doesn't have 'receiver' in friends list.
            sender.friends.push(receiver._id);
            await sender.save();

            // Check receiver side too
            if (!receiver.friends.includes(sender._id)) {
                receiver.friends.push(sender._id);
                await receiver.save();
            }

            return res.status(200).json({ message: 'Friend added (restored)' });
        } else if (existingRequest.status === 'pending') {
            res.status(400);
            if (existingRequest.sender.toString() === req.user._id.toString()) {
                throw new Error('Friend request already sent');
            } else {
                throw new Error('This user has already sent you a request. Check your notifications.');
            }
        } else {
            // Should theoretically be 'rejected' or logic flaw.
            // If rejected, allow re-sending by resetting this request.
            
            // If we found a request where current user matches sender:
            if(existingRequest.sender.toString() === req.user._id.toString()){
               existingRequest.status = 'pending';
               await existingRequest.save();
               res.status(200).json({ message: 'Friend request sent again' });
               return;
            } else {
               // The other person rejected YOU.
               // Update existing to be pending again, but SWAP sender/receiver to make it "new" from this user
               existingRequest.status = 'pending';
               existingRequest.sender = req.user._id; 
               existingRequest.receiver = receiver._id;
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

    if (request.status === 'rejected') {
        res.status(400);
        throw new Error('Request has been rejected');
    }

    // Idempotency: If pending, mark accepted. If accepted, just ensure linking.
    if (request.status === 'pending') {
        request.status = 'accepted';
        await request.save();
    }

    // Add to friends lists safely
    const sender = await User.findById(request.sender);
    const receiver = await User.findById(request.receiver);

    if (!sender || !receiver) {
        res.status(404);
        throw new Error('One of the users involved in this request no longer exists');
    }

    if (!sender.friends.includes(receiver._id)) {
        sender.friends.push(receiver._id);
        await sender.save();
    }
    
    if (!receiver.friends.includes(sender._id)) {
        receiver.friends.push(sender._id);
        await receiver.save();
    }

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

// @desc    Remove a friend
// @route   DELETE /api/friends/:id
// @access  Private
const removeFriend = asyncHandler(async (req, res) => {
    const friendId = req.params.id;
    const userId = req.user._id;

    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!friend) {
        res.status(404);
        throw new Error('User not found');
    }

    // Remove from friends arrays
    user.friends = user.friends.filter(id => id.toString() !== friendId.toString());
    friend.friends = friend.friends.filter(id => id.toString() !== userId.toString());

    await user.save();
    await friend.save();

    // Clean up Friend Request (so they can re-add each other)
    await FriendRequest.findOneAndDelete({
        $or: [
            { sender: userId, receiver: friendId },
            { sender: friendId, receiver: userId }
        ]
    });

    res.json({ message: 'Friend removed' });
});

export { sendFriendRequest, getFriendRequests, acceptFriendRequest, rejectFriendRequest, getFriends, removeFriend };
