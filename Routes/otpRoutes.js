const express = require("express");
const router = express.Router();
const otpController = require("../Controller/otpController");

// Endpoint to request OTP

router.post("/send-otp", otpController.sendOTP);

// Endpoint to verify OTP and log in

router.post("/verify-otp", otpController.verifyOTP);

module.exports = router;
