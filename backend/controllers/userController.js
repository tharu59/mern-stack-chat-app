const User = require("../models/UserModel");
const jwt = require("jsonwebtoken");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Register new user
// @route   POST /api/user/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { fullName, username, password, confirmPassword, gender } = req.body;

    // Check if all fields are provided
    if (!fullName || !username || !password || !confirmPassword || !gender) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Check if user already exists
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Generate profile picture based on gender
    const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${username}`;
    const girlProfilePic = `https://avatar.iran.liara.run/public/girl?username=${username}`;

    // Create user
    const user = await User.create({
      fullName,
      username,
      password,
      gender,
      profilePic: gender === "male" ? boyProfilePic : girlProfilePic,
    });

    if (user) {
      // Generate token and set cookie
      const token = generateToken(user._id);

      res.cookie("jwt", token, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV !== "development",
      });

      res.status(201).json({
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        profilePic: user.profilePic,
        gender: user.gender,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in registerUser controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/user/login
// @access  Public
const authUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if all fields are provided
    if (!username || !password) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    // Find user by username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    // Check password
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    // Generate token and set cookie
    const token = generateToken(user._id);

    res.cookie("jwt", token, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV !== "development",
    });

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      profilePic: user.profilePic,
      gender: user.gender,
    });
  } catch (error) {
    console.log("Error in authUser controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/user/logout
// @access  Public
const logoutUser = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logoutUser controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// @desc    Get all users except the logged in user
// @route   GET /api/user/all
// @access  Private
const allUsers = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // Get all users except the logged in user
    const users = await User.find({ _id: { $ne: loggedInUserId } }).select(
      "-password"
    );

    res.status(200).json(users);
  } catch (error) {
    console.log("Error in allUsers controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { registerUser, authUser, logoutUser, allUsers };
