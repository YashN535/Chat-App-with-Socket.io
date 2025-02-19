(function () {
  // --------------------------------------------------
  // Global Variables
  // --------------------------------------------------
  window.socket = io();
  window.messageContainer = document.getElementById("message-container");
  window.nameInput = document.getElementById("name-input");
  window.messageForm = document.getElementById("message-form");
  window.messageInput = document.getElementById("message-input");
  window.clientsTotal = document.getElementById("client-total");
  window.messageTone = new Audio("/public_message-tone.mp3");
  window.searchInput = document.getElementById("search-input");
  window.encryptionKey = null;
  window.username = "Guest";
  window.sentTempIds = new Set();
  window.selectedMessages = new Set();

  // --------------------------------------------------
  // Initialize Encryption (Prompt & Derive Key)
  // --------------------------------------------------
  (async function initEncryption() {
    let passphrase = localStorage.getItem("chatPassphrase");
    if (!passphrase) {
      passphrase = prompt(
        "Enter chat passphrase (all participants must use the same passphrase):"
      );
      localStorage.setItem("chatPassphrase", passphrase);
    }
    window.encryptionKey = await window.deriveKey(passphrase);
  })();

  // --------------------------------------------------
  // Load Profile & Initialize Context Menu
  // --------------------------------------------------
  window.addEventListener("DOMContentLoaded", async () => {
    try {
      // Retrieve the token from localStorage
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No token found. Redirecting to signin.html.");
        window.location.href = "signin.html";
        return;
      }

      // Fetch profile data using the token in the Authorization header
      const response = await fetch("/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const userData = await response.json();

        document.getElementById("profile-pic").src = userData.profilePic;
        window.username =
          userData.username || userData.name || userData.user || "Guest";
        window.socket.emit("set-username", window.username);
        document.getElementById("name-input").value = window.username;
        window.loadMessageHistory();
      } else {
        const errorText = await response.text();
        console.error("Profile fetch error:", errorText);
        window.location.href = "signin.html";
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
      window.location.href = "signin.html";
    }
  });

  // --------------------------------------------------
  // Socket.io Listeners
  // --------------------------------------------------
  window.socket.on("clients-total", (total) => {
    window.clientsTotal.innerText = `Total Clients: ${total}`;
  });

  window.socket.on("chat-message", async (data) => {
    try {
      if (data.username === window.username && data.tempId) {
        const existingMessage = document.querySelector(
          `li[data-temp-id="${data.tempId}"]`
        );
        if (existingMessage) {
          existingMessage.setAttribute("data-id", data._id);
          return;
        }
      }
      if (data.attachment) {
        window.addMessageToUI(data.username === window.username, data);
      } else {
        const decryptedText = await window.decryptMessage(
          data.message,
          window.encryptionKey
        );
        const decryptedData = { ...data, message: decryptedText };
        window.addMessageToUI(data.username === window.username, decryptedData);
      }
    } catch (error) {
      console.error("Error decrypting message:", error);
    }
  });

  window.socket.on("delete-message", (messageId) => {
    const messageElement = document.querySelector(`li[data-id="${messageId}"]`);
    if (messageElement) messageElement.remove();
  });

  // --------------------------------------------------
  // Sending Text Messages
  // --------------------------------------------------
  window.messageForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await sendMessage();
  });

  async function sendMessage() {
    if (window.messageInput.value.trim() === "") return;
    const plaintext = window.messageInput.value;
    const encryptedText = await window.encryptMessage(
      plaintext,
      window.encryptionKey
    );
    const tempId = Date.now() + "-" + Math.random();
    window.sentTempIds.add(tempId);
    const messageData = {
      tempId,
      message: encryptedText,
      username: window.username,
      profilePic: document.getElementById("profile-pic").src,
    };
    window.socket.emit("message", messageData);
    window.addMessageToUI(true, {
      ...messageData,
      message: plaintext,
      timestamp: new Date(),
    });
    window.messageInput.value = "";
    window.messageTone.play().catch(console.error);
  }

  // --------------------------------------------------
  // Typing Feedback
  // --------------------------------------------------
  window.messageInput.addEventListener("focus", () => {
    window.socket.emit("feedback", {
      feedback: `${window.username} is typing...`,
    });
  });
  window.messageInput.addEventListener("keypress", () => {
    window.socket.emit("feedback", {
      feedback: `${window.username} is typing...`,
    });
  });
  window.messageInput.addEventListener("blur", () => {
    window.socket.emit("feedback", { feedback: "" });
  });

  window.socket.on("feedback", (data) => {
    window.clearFeedback();
    const element = document.createElement("li");
    element.classList.add("message-feedback");
    const p = document.createElement("p");
    p.classList.add("feedback");
    p.textContent = data.feedback;
    element.appendChild(p);
    window.messageContainer.appendChild(element);
  });
})();
