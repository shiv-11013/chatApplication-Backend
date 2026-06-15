const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const register = async (req, res) => {
  const { username, password, avatar } = req.body; // avatar bhi lo
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists. please Login" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = new User({ username, password: hashedPassword, avatar });
    await user.save();
    res.status(201).json({ message: "Registered successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const isPasswordMatch = await existingUser.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }
    const token = jwt.sign({ id: existingUser._id }, process.env.JWT_SECRET, {
      expiresIn: "4h",
    });
    res.status(200).json({
      message: "Login successful",
      username: existingUser.username,
      avatar: existingUser.avatar,
      token,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error while login.", error: error.message });
  }
};

module.exports = { register, login };
