const User = require("../models/User");

const getUsers = async (req, res) => {
  try {
    const { currentUser } = req.query;

    if (!currentUser) {
      return res.status(400).json({ message: "Current user is required" });
    }

    const users = await User.find({
      username: { $ne: currentUser },
    }).select("-password");

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

module.exports = {
  getUsers,
};