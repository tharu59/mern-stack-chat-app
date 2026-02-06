const express = require("express");
const userRouter = express.Router();
const {
  registerUser,
  authUser,
  logoutUser,
  allUsers,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

userRouter.post("/register", registerUser);
userRouter.post("/login", authUser);
userRouter.post("/logout", logoutUser);
userRouter.get("/all", protect, allUsers);

module.exports = userRouter;
