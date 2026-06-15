const express = require("express");
const { getImageKitAuth } = require("../controllers/upload.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/auth", authMiddleware, getImageKitAuth);

module.exports = router;