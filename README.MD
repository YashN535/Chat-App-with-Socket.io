# Chat App with Socket.io

A real-time chat application built with Node.js, Express, Socket.io, and MongoDB. This application provides user authentication with JWT, real‐time messaging, profile picture uploads, and support for file attachments.

## Features

- **Real-Time Chat:**  
  Leverages Socket.io to enable live messaging between users.
- **User Authentication:**  
  Secure signup, signin, and logout using JWT-based authentication.
- **Profile Management:**  
  Supports uploading and updating profile pictures with file validation using Multer.
- **Message History & Attachments:**  
  Chat messages are stored in MongoDB, and users can attach files (images, videos, PDFs, etc.) during conversations.

## Technologies Used

- **Backend:** Node.js, Express
- **Real-Time Communication:** Socket.io
- **Database:** MongoDB (with Mongoose ODM)
- **Authentication:** JWT, bcrypt for password hashing
- **File Uploads:** Multer
- **Additional Middleware:** CORS, Cookie-parser

## Installation

1. **Clone the Repository:**

  - git clone https://github.com/YashN535/Chat-App-with-Socket.io.git
  - cd Chat-App-with-Socket.io

2. **Install Dependencies:**

  - `npm install`

3. **Start the Application:**

  - `node server.js`

4. **Access the Application:**

- Open your web browser and navigate to `http://localhost:4000` to access the chat application.
