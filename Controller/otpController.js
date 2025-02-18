require("dotenv").config();
const nodemailer = require("nodemailer");
const twilio = require("twilio");
const speakeasy = require("speakeasy");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const SECRET_KEY = process.env.SECRET_KEY || "your_SECRET_KEY";

// Setup Nodemailer (for email OTP)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL, // from .env file
    pass: process.env.EMAIL_PASS, // from .env file
  },
});

// Setup Twilio (for SMS OTP)
const twilioClient = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Send OTP via email or SMS.
 */
exports.sendOTP = async (req, res) => {
  try {
    const { email, phone } = req.body;
    if (!email && !phone) {
      return res.status(400).json({ message: "Email or Phone is required" });
    }

    // Generate a 6-digit OTP using speakeasy.
    const otp = speakeasy.totp({
      secret: "otp_secret", // In production, consider a dynamic or per-user secret
      digits: 6,
      encoding: "base32",
    });

    // Set OTP expiry (2 minutes from now)
    const otpExpires = Date.now() + 2 * 60 * 1000;

    // Find the user (or create one if you want to allow OTP login without prior registration)
    let user = await User.findOne({ $or: [{ email }, { phone }] });
    if (!user) {
      user = new User({ email, phone });
    }
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP by email if email is provided.
    if (email) {
      const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP is ${otp}. It is valid for 2 minutes.`,
      };
      await transporter.sendMail(mailOptions);
      return res.json({ message: "OTP sent to email" });
    }

    // Otherwise, send OTP by SMS.
    if (phone) {
      await twilioClient.messages.create({
        body: `Your OTP is ${otp}. It is valid for 2 minutes.`,
        from: process.env.TWILIO_PHONE, // Your Twilio phone number from .env
        to: phone,
      });
      return res.json({ message: "OTP sent to phone" });
    }
  } catch (error) {
    console.error("Error in sendOTP:", error);
    return res.status(500).json({ message: "Error sending OTP", error });
  }
};

/**
 * Verify the OTP and log in the user.
 */
exports.verifyOTP = async (req, res) => {
  try {
    const { email, phone, otp } = req.body;
    if (!otp || (!email && !phone)) {
      return res
        .status(400)
        .json({ message: "OTP and Email/Phone are required" });
    }

    // Locate the user based on email or phone.
    const user = await User.findOne({ $or: [{ email }, { phone }] });
    if (!user || !user.otp || Date.now() > user.otpExpires) {
      return res.status(400).json({ message: "OTP expired or invalid" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // OTP is verified; generate a JWT token.
    const token = jwt.sign(
      { id: user._id, email: user.email, phone: user.phone },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    // Clear OTP fields after successful verification.
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    return res.json({ message: "OTP verified successfully", token });
  } catch (error) {
    console.error("Error in verifyOTP:", error);
    return res.status(500).json({ message: "Error verifying OTP", error });
  }
};
