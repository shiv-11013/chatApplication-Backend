const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const { getMessages } = require("../controllers/message.controller");

const router = express.Router();

router.get("/", authMiddleware, getMessages);

module.exports = router;