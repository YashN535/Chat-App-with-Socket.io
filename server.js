require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./db");
const PORT = process.env.PORT || 4000;
const otpRoutes = require("./Routes/otpRoutes");
const authRoutes = require("./Routes/authRoutes");
const User = require("./models/user");
const Message = require("./models/message");
const { Server } = require("socket.io");

// Connect to MongoDB

connectDB();

// Create the HTTP server

const server = http.createServer(app);

// Mount OTP routes under /api
app.use("/api", authRoutes);
app.use("/api", otpRoutes);

// Initialize Socket.io

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Make Socket.io accessible in routes via app locals

app.set("io", io);

const users = new Map(); // Map to store user data with socket IDs

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  socket.on("set-username", (username) => {
    users.set(socket.id, {
      username: username || "Anonymous",
      lastActive: new Date(),
    });
    io.emit("clients-total", users.size);
  });

  // When a message is received, store it in the database and broadcast it

  socket.on("message", async (data) => {
    try {
      const user = users.get(socket.id);
      if (!user) {
        console.error("User not found for socket:", socket.id);
        return;
      }
      const userDoc = await User.findOne({ username: user.username });
      const messageData = {
        username: user.username,
        message: data.message,
        profilePic: userDoc
          ? userDoc.profilePic
          : "/uploads/default-profile-pic.png",
        timestamp: new Date(),
        tempId: data.tempId || null,
        attachment: data.attachment || null,
      };
      const savedMessage = new Message(messageData);
      await savedMessage.save();
      messageData._id = savedMessage._id;
      io.emit("chat-message", messageData);
    } catch (error) {
      console.error("Error handling message:", error);
    }
  });

  socket.on("feedback", (data) => {
    socket.broadcast.emit("feedback", data);
  });

  socket.on("disconnect", () => {
    const user = users.get(socket.id);
    if (user) {
      console.log(`❌ User ${user.username || "Unknown"} disconnected`);
      users.delete(socket.id);
      io.emit("clients-total", users.size);
    }
  });
});

// Start the server

server.listen(PORT, () => console.log(`💬 Server running on port ${PORT}`));
