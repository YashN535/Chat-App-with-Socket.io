(function () {
  window.addMessageToUI = function (isOwnMessage, data) {
    window.clearFeedback();
    const element = document.createElement("li");
    if (data.tempId) element.setAttribute("data-temp-id", data.tempId);
    if (data._id) element.setAttribute("data-id", data._id);
    element.dataset.username = data.username;
    element.classList.add(isOwnMessage ? "message-right" : "message-left");

    const profilePic = document.createElement("img");
    profilePic.src = data.profilePic || "/uploads/default-profile-pic.png";
    profilePic.alt = `${data.username}'s profile picture`;
    profilePic.classList.add("profile-pic");

    const messageContent = document.createElement("div");
    messageContent.classList.add("message");

    if (data.attachment && data.attachment.url) {
      if (data.attachment.type.startsWith("image")) {
        const img = document.createElement("img");
        img.src = data.attachment.url;
        img.alt = "Image attachment";
        img.classList.add("attachment-image");
        messageContent.appendChild(img);
      } else if (data.attachment.type.startsWith("video")) {
        const video = document.createElement("video");
        video.src = data.attachment.url;
        video.controls = true;
        video.classList.add("attachment-video");
        messageContent.appendChild(video);
      } else {
        const link = document.createElement("a");
        link.href = data.attachment.url;
        link.textContent = "Download Attachment";
        link.target = "_blank";
        link.classList.add("attachment-document");
        messageContent.appendChild(link);
      }
    } else {
      const p = document.createElement("p");
      p.classList.add("message-text");
      p.textContent = data.message;
      messageContent.appendChild(p);
    }

    const messageMeta = document.createElement("span");
    messageMeta.textContent = ` ● ${data.username} ● ${moment(
      data.timestamp
    ).fromNow()}`;
    messageContent.appendChild(messageMeta);

    element.appendChild(profilePic);
    element.appendChild(messageContent);

    element.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      window.showMessageContextMenu(e, element);
    });
    element.addEventListener("click", (e) => {
      if (
        element.dataset.username === window.username &&
        window.selectedMessages.size > 0
      ) {
        if (window.selectedMessages.has(element)) {
          element.classList.remove("selected");
          window.selectedMessages.delete(element);
        } else {
          element.classList.add("selected");
          window.selectedMessages.add(element);
        }
      }
    });

    window.messageContainer.appendChild(element);
    window.scrollToBottom();
  };

  window.showMessageContextMenu = function (e, messageElement) {
    const options = [];
    if (messageElement.dataset.username === window.username) {
      options.push({
        label: "Delete Message",
        action: () => {
          const messageId = messageElement.getAttribute("data-id");
          if (messageId) window.deleteMessage(messageId, messageElement);
        },
      });
    }
    if (window.selectedMessages.has(messageElement)) {
      options.push({
        label: "Deselect Message",
        action: () => {
          messageElement.classList.remove("selected");
          window.selectedMessages.delete(messageElement);
        },
      });
    } else {
      options.push({
        label: "Select Message",
        action: () => {
          messageElement.classList.add("selected");
          window.selectedMessages.add(messageElement);
        },
      });
    }
    if (window.selectedMessages.size > 0) {
      options.push({
        label: "Delete Selected",
        action: () => window.deleteSelectedMessages(),
      });
      options.push({
        label: "Select All",
        action: () => window.selectAllMessages(),
      });
    }
    options.push({ label: "Cancel", action: () => {} });
    window.showContextMenuAt(e.pageX, e.pageY, options);
  };

  window.deleteMessage = async function (messageId, messageElement) {
    try {
      const response = await fetch(`/messages/${messageId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok) {
        messageElement.remove();
        window.selectedMessages.delete(messageElement);
      } else {
        alert(data.error || "Error deleting message");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Error deleting message");
    }
  };

  window.deleteSelectedMessages = async function () {
    const messagesToDelete = Array.from(window.selectedMessages);
    for (let msg of messagesToDelete) {
      const messageId = msg.getAttribute("data-id");
      if (messageId) await window.deleteMessage(messageId, msg);
    }
    window.selectedMessages.clear();
  };

  window.selectAllMessages = function () {
    const messages = window.messageContainer.getElementsByTagName("li");
    for (let msg of messages) {
      if (
        msg.dataset.username === window.username &&
        !window.selectedMessages.has(msg)
      ) {
        msg.classList.add("selected");
        window.selectedMessages.add(msg);
      }
    }
  };

  window.scrollToBottom = function () {
    window.messageContainer.scrollTo(0, window.messageContainer.scrollHeight);
  };

  window.clearFeedback = function () {
    document
      .querySelectorAll("li.message-feedback")
      .forEach((element) => element.remove());
  };

  window.loadMessageHistory = async function () {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/messages", {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const messages = await response.json();
        for (let msg of messages) {
          try {
            if (msg.attachment) {
              window.addMessageToUI(msg.username === window.username, msg);
            } else {
              const decryptedText = await window.decryptMessage(
                msg.message,
                window.encryptionKey
              );
              msg.message = decryptedText;
              window.addMessageToUI(msg.username === window.username, msg);
            }
          } catch (e) {
            console.error("Error decrypting message from history:", e);
          }
        }
      } else {
        console.error("Failed to load message history");
      }
    } catch (error) {
      console.error("Error fetching message history:", error);
    }
  };
})();
