(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const attachmentButton = document.getElementById("attachment-button");
    if (!attachmentButton) {
      console.error("Attachment button element not found");
      return;
    }
    const imageInput = document.createElement("input");
    imageInput.type = "file";
    imageInput.accept = "image/*";
    imageInput.style.display = "none";
    const videoInput = document.createElement("input");
    videoInput.type = "file";
    videoInput.accept = "video/*";
    videoInput.style.display = "none";
    const documentInput = document.createElement("input");
    documentInput.type = "file";
    documentInput.accept = ".pdf,.doc,.docx,.txt";
    documentInput.style.display = "none";
    document.body.appendChild(imageInput);
    document.body.appendChild(videoInput);
    document.body.appendChild(documentInput);

    attachmentButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const options = [
        { label: "Photo", action: () => imageInput.click() },
        { label: "Video", action: () => videoInput.click() },
        { label: "Document", action: () => documentInput.click() },
        { label: "Cancel", action: () => {} },
      ];
      window.showContextMenuAt(e.pageX, e.pageY, options);
    });

    imageInput.addEventListener("change", handleAttachmentChange);
    videoInput.addEventListener("change", handleAttachmentChange);
    documentInput.addEventListener("change", handleAttachmentChange);
  });

  async function handleAttachmentChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("attachment", file);
    formData.append("type", file.type);
    try {
      const response = await fetch("/messages/upload-attachment", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        const tempId = Date.now() + "-" + Math.random();
        const messageData = {
          tempId,
          message: "",
          attachment: data.attachment,
          username: window.username,
          profilePic: document.getElementById("profile-pic").src,
          timestamp: new Date(),
        };
        window.socket.emit("message", messageData);
        window.addMessageToUI(true, messageData);
      } else {
        alert(data.error || "Error uploading attachment");
      }
    } catch (error) {
      console.error("Error uploading attachment:", error);
      alert("Error uploading attachment");
    }
  }
})();
