const Chat = require("../models/ChatModel");
const User = require("../models/UserModel");
const Group = require("../models/GroupModel");

// @desc    Send a message
// @route   POST /api/chat/send/:id
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Find existing conversation between sender and receiver
    let conversation = await Group.findOne({
      isGroupChat: false,
      users: { $all: [senderId, receiverId] },
    });

    // If no conversation exists, create one
    if (!conversation) {
      conversation = await Group.create({
        isGroupChat: false,
        users: [senderId, receiverId],
      });
    }

    // Create new message
    const newMessage = new Chat({
      sender: senderId,
      content: message,
      group: conversation._id,
    });

    // Save message
    if (newMessage) {
      conversation.latestMessage = newMessage._id;
    }

    // Save both in parallel
    await Promise.all([conversation.save(), newMessage.save()]);

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// @desc    Get all messages in a conversation
// @route   GET /api/chat/:id
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const senderId = req.user._id;

    // Find conversation between sender and receiver
    const conversation = await Group.findOne({
      isGroupChat: false,
      users: { $all: [senderId, userToChatId] },
    });

    if (!conversation) {
      return res.status(200).json([]);
    }

    // Get all messages in the conversation
    const messages = await Chat.find({ group: conversation._id })
      .populate("sender", "fullName username profilePic")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// @desc    Get all conversations for the logged in user
// @route   GET /api/chat/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all conversations where the user is a participant
    const conversations = await Group.find({
      users: { $in: [userId] },
    })
      .populate("users", "fullName username profilePic")
      .populate("latestMessage")
      .populate("groupAdmin", "fullName username profilePic")
      .sort({ updatedAt: -1 });

    // Populate sender in latestMessage
    const populatedConversations = await Chat.populate(conversations, {
      path: "latestMessage.sender",
      select: "fullName username profilePic",
    });

    res.status(200).json(populatedConversations);
  } catch (error) {
    console.log("Error in getConversations controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { sendMessage, getMessages, getConversations };
