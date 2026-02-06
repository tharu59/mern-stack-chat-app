const Group = require("../models/GroupModel");
const User = require("../models/UserModel");
const Chat = require("../models/ChatModel");

// @desc    Create a group chat
// @route   POST /api/group/create
// @access  Private
const createGroupChat = async (req, res) => {
  try {
    const { chatName, users } = req.body;

    if (!chatName || !users) {
      return res
        .status(400)
        .json({ message: "Please provide group name and users" });
    }

    // Parse users if it's a string
    let usersList = typeof users === "string" ? JSON.parse(users) : users;

    // Add the current user to the group
    usersList.push(req.user._id);

    // Ensure at least 3 users for a group chat
    if (usersList.length < 3) {
      return res
        .status(400)
        .json({ message: "A group chat must have at least 3 members" });
    }

    // Create the group
    const groupChat = await Group.create({
      chatName,
      isGroupChat: true,
      users: usersList,
      groupAdmin: req.user._id,
    });

    // Populate and return the group
    const fullGroupChat = await Group.findById(groupChat._id)
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(201).json(fullGroupChat);
  } catch (error) {
    console.log("Error in createGroupChat controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// @desc    Rename a group
// @route   PUT /api/group/rename
// @access  Private
const renameGroup = async (req, res) => {
  try {
    const { groupId, chatName } = req.body;

    if (!groupId || !chatName) {
      return res
        .status(400)
        .json({ message: "Please provide group ID and new name" });
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      { chatName },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!updatedGroup) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.log("Error in renameGroup controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// @desc    Add user to group
// @route   PUT /api/group/add
// @access  Private
const addToGroup = async (req, res) => {
  try {
    const { groupId, userId } = req.body;

    if (!groupId || !userId) {
      return res
        .status(400)
        .json({ message: "Please provide group ID and user ID" });
    }

    // Check if the user making the request is the admin
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.groupAdmin.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only the group admin can add members" });
    }

    // Add user to group
    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      { $push: { users: userId } },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.log("Error in addToGroup controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// @desc    Remove user from group
// @route   PUT /api/group/remove
// @access  Private
const removeFromGroup = async (req, res) => {
  try {
    const { groupId, userId } = req.body;

    if (!groupId || !userId) {
      return res
        .status(400)
        .json({ message: "Please provide group ID and user ID" });
    }

    // Check if the user making the request is the admin
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.groupAdmin.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only the group admin can remove members" });
    }

    // Remove user from group
    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      { $pull: { users: userId } },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.log("Error in removeFromGroup controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// @desc    Send message to group
// @route   POST /api/group/message/:groupId
// @access  Private
const sendGroupMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const { groupId } = req.params;
    const senderId = req.user._id;

    // Find the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is part of the group
    if (!group.users.includes(senderId)) {
      return res
        .status(403)
        .json({ message: "You are not a member of this group" });
    }

    // Create new message
    const newMessage = await Chat.create({
      sender: senderId,
      content: message,
      group: groupId,
    });

    // Update latest message
    group.latestMessage = newMessage._id;
    await group.save();

    // Populate and return message
    const populatedMessage = await Chat.findById(newMessage._id).populate(
      "sender",
      "fullName username profilePic"
    );

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.log("Error in sendGroupMessage controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// @desc    Get all messages in a group
// @route   GET /api/group/messages/:groupId
// @access  Private
const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    // Find the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is part of the group
    if (!group.users.includes(userId)) {
      return res
        .status(403)
        .json({ message: "You are not a member of this group" });
    }

    // Get all messages
    const messages = await Chat.find({ group: groupId })
      .populate("sender", "fullName username profilePic")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getGroupMessages controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
  sendGroupMessage,
  getGroupMessages,
};
