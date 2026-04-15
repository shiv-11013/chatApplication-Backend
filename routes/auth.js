const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
console.log("JWT_SECRET:", JWT_SECRET);

router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const exisitngUser = await User.findOne({ username });
    if (exisitngUser) {
      return res
        .status(400)
        .json({ message: "User already exists. please Login" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ username, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "4h" });
    res
      .status(201)
      .json({ message: "Server registered successfully.", token, username });
  } catch (error) {
    console.error("Full error:", error);
    console.error("Error message:", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user) return res.status(404).json({ message: "User not found" });

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch)
      return res.status(400).json({ message: "Invalid Credentials" });
    res
      .status(200)
      .json({ message: "Login successfull", username: user.username });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error while login.", error: error });
  }
});

module.exports = router;
