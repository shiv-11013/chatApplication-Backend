router.post("/login", async (req, res) => {
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
      token,
    });
  } catch (error) {
    console.error("Login Error:", error.message); // matches your earlier debug style

    res.status(500).json({
      message: "Server error while login.",
      error: error.message,
    });
  }
});
