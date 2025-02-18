const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();

const {
  signup,
  signin,
  logout,
  uploadProfilePic,
  getProfile,
  authMiddleware,
} = require("../Controller/authController");

// Multer storage configuration for profile pictures

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/HEIC",
      "image/png",
      "image/gif",
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file type"), null);
    }
    cb(
      null,
      `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(
        file.originalname
      )}`
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|HEIC|png|gif)$/)) {
      return cb(new Error("Please upload an image file"), false);
    }
    cb(null, true);
  },
});

// Signup route with file upload middleware.

router.post("/signup", upload.single("profilePic"), signup);

// Signin route.

router.post("/signin", signin);

// Logout route.

router.post("/logout", logout);

// Profile picture upload route.

router.post(
  "/upload-profile-pic",
  authMiddleware,
  upload.single("profilePic"),
  uploadProfilePic
);

// Profile route.

router.get("/profile", authMiddleware, getProfile);

module.exports = router;
