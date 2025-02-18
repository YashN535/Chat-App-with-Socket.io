require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const authRoutes = require("./Routes/authRoutes");
const { authMiddleware } = require("./Controller/authController");
const Message = require("./models/message");
const app = express();
const uploadDir = path.join(__dirname, "uploads");

// Middleware

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Ensure the uploads directory exists

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Ensure the attachments directory exists

const attachmentsDir = path.join(__dirname, "uploads", "attachments");
if (!fs.existsSync(attachmentsDir)) {
  fs.mkdirSync(attachmentsDir, { recursive: true });
}

// Multer storage configuration for attachments

const attachmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, attachmentsDir);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() +
        "-" +
        Math.round(Math.random() * 1e9) +
        path.extname(file.originalname)
    );
  },
});

// Configure multer for attachments

const attachmentUpload = multer({
  storage: attachmentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "video/mp4",
      "video/webm",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"), false);
    }
  },
});

// Routes
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "signin.html"));
});

app.get("/chat", authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

// Endpoint to get message history

app.get("/messages", authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({}).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to load messages" });
  }
});

// Endpoint to delete a message

app.delete("/messages/:id", authMiddleware, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    // Only allow deletion if the message belongs to the requesting user

    if (message.username !== req.user.username) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this message" });
    }
    await message.deleteOne();

    // Broadcast deletion to all connected clients via Socket.io

    const io = req.app.get("io");
    if (io) {
      io.emit("delete-message", req.params.id);
    }
    res.json({ message: "Message deleted" });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: "Failed to delete message" });
  }
});

// Endpoint for attachment upload

app.post(
  "/messages/upload-attachment",
  authMiddleware,
  attachmentUpload.single("attachment"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Build the file URL (assuming the uploads folder is publicly served)

      const fileUrl = `/uploads/attachments/${req.file.filename}`;
      const attachment = {
        url: fileUrl,
        type: req.body.type || req.file.mimetype,
      };
      res.json({ attachment });
    } catch (error) {
      console.error("Error uploading attachment:", error);
      res.status(500).json({ error: "Error uploading attachment" });
    }
  }
);

module.exports = app;
