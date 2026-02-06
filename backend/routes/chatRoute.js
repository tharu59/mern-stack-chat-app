const express = require("express");
const chatRouter = express.Router();
const {
  sendMessage,
  getMessages,
  getConversations,
} = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");

// All routes are protected
chatRouter.use(protect);

// Get all conversations for the logged in user
chatRouter.get("/conversations", getConversations);

// Get messages with a specific user
chatRouter.get("/:id", getMessages);

// Send message to a specific user
chatRouter.post("/send/:id", sendMessage);

module.exports = chatRouter;
