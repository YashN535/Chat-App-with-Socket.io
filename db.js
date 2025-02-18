require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;

function connectDB() {
  mongoose
    .connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("✅ Database Connected Successfully"))
    .catch((error) => console.error("❌ Database Connection Failed:", error));
}

module.exports = connectDB;
