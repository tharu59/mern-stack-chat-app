const express = require("express");
const groupRouter = express.Router();
const {
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
  sendGroupMessage,
  getGroupMessages,
} = require("../controllers/groupController");
const { protect } = require("../middleware/authMiddleware");

// All routes are protected
groupRouter.use(protect);

// Group management routes
groupRouter.post("/create", createGroupChat);
groupRouter.put("/rename", renameGroup);
groupRouter.put("/add", addToGroup);
groupRouter.put("/remove", removeFromGroup);

// Group messaging routes
groupRouter.post("/message/:groupId", sendGroupMessage);
groupRouter.get("/messages/:groupId", getGroupMessages);

module.exports = groupRouter;
