require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const SECRET_KEY =
  process.env.SECRET_KEY || require("crypto").randomBytes(64).toString("hex");

// Controller for user signup.

exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Username, email and password are required" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const profilePic = req.file
      ? `/uploads/${req.file.filename}`
      : "/uploads/default-profile-pic.png";
    const user = new User({
      username,
      email,
      password: hashedPassword,
      profilePic,
      createdAt: new Date(),
      lastLogin: new Date(),
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      SECRET_KEY,
      { expiresIn: "15m", algorithm: "HS256" } // 15 minutes
    );

    // Set the token in a cookie.

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.status(201).json({
      message: "User created successfully",
      token,
      user: { username: user.username, profilePic: user.profilePic },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Error creating user" });
  }
};

// Controller for user signin.

exports.signin = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ message: "Email/Username and password required" });
    }

    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        profilePic: user.profilePic,
      },
      SECRET_KEY,
      { expiresIn: "15m", algorithm: "HS256" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.json({
      message: "Login successful",
      token,
      user: { username: user.username, profilePic: user.profilePic },
      redirect: "/home.html",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Error during login" });
  }
};

// Controller for logging out.

exports.logout = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "User logged out successfully!" });
};

// Controller to update the profile picture.

exports.uploadProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const profilePicPath = `/uploads/${req.file.filename}`;
    await User.findByIdAndUpdate(req.user._id, { profilePic: profilePicPath });
    res.json({
      message: "Profile picture updated successfully",
      profilePic: profilePicPath,
    });
  } catch (error) {
    console.error("Profile picture upload error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Controller for retrieving the authenticated user's profile.

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ username: user.username, profilePic: user.profilePic });
  } catch (error) {
    res.status(500).json({ error: "Error fetching profile" });
  }
};

// Authentication middleware to protect routes.
// Looks for the token in the Authorization header or in cookies.

// exports.authMiddleware = async (req, res, next) => {
//   let token;

//   // Try to get token from Authorization header
//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith("Bearer ")
//   ) {
//     token = req.headers.authorization.split(" ")[1];
//   }
//   // If not in header, try cookies (set as httpOnly)
//   else if (req.cookies && req.cookies.token) {
//     token = req.cookies.token;
//   }

//   if (!token) {
//     return res.status(401).json({ message: "No token provided" });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.SECRET_KEY);
//     // Attach user to req after fetching from DB (exclude password)
//     req.user = await User.findById(decoded.Id).select("-password");
//     if (!req.user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     next();
//   } catch (error) {
//     console.error("authMiddleware error:", error);
//     res.status(401).json({ message: "Token is not valid" });
//   }
// };

exports.sendTokenAsCookie = (res, token) => {
  const options = {
    expires: new Date(Date.now() + 3600 * 1000), // 1 hour expiry
    httpOnly: true,
  };
  // Set token in cookie so that protected routes get it automatically
  res.cookie("token", token, options);
};

exports.authMiddleware = async (req, res, next) => {
  try {
    let token;
    if (req.header("Authorization")?.startsWith("Bearer ")) {
      token = req.header("Authorization").replace("Bearer ", "");
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

exports.SECRET_KEY = SECRET_KEY;
