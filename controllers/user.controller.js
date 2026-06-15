const User = require("../models/User");

const getUsers = async (req, res) => {
  try {
    const { currentUser } = req.query;

    if (!currentUser) {
      return res.status(400).json({ message: "Current user is required" });
    }

    const users = await User.find({
      username: { $ne: currentUser },
    }).select("username avatar");

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

const updateAvatar = async (req, res) => {
  const { avatar } = req.body;
 
  if (!avatar) {
    return res.status(400).json({ message: "Avatar URL is required." });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar },
      { new: true },
    ).select("username avatar");

    res.json({
      message: "Profile photo updated successfully.",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not update profile photo.",
      error: error.message,
    });
  }
};

module.exports = {
  getUsers,
  updateAvatar,
};
