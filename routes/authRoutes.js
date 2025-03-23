const express = require("express");
const router = express.Router();
const { validateSignup } = require("../middleware/validateMiddleware");
const { signup, login } = require("../controllers/authController");

// Routes
router.post("/signup", validateSignup, signup);
router.post("/login", validateSignup, login); // Line 9 - Now using the login controller

module.exports = router;
