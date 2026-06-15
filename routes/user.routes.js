const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const { getUsers, updateAvatar } = require("../controllers/user.controller");

const router = express.Router();

router.get("/", authMiddleware, getUsers);

router.patch("/avatar", authMiddleware, updateAvatar);

module.exports = router;
