const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  message: {
    // The encrypted message text
    type: String,
    default: "",
  },
  profilePic: {
    type: String,
    default: "/uploads/default-profile-pic.png",
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  tempId: {
    // temporary id provided by the client to help update its own message
    type: String,
  },
  attachment: {
    url: { type: String },
    type: { type: String },
  },
});

module.exports = mongoose.model("Message", MessageSchema);
