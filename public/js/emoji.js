document.addEventListener("DOMContentLoaded", () => {
  // Ensure the EmojiButton library is loaded

  if (typeof EmojiButton === "undefined") {
    console.error(
      "EmojiButton library not loaded. Please include it via a <script> tag."
    );
    return;
  }

  // Get required DOM elements
  const emojiButton = document.getElementById("emoji-button");
  const messageInput = document.getElementById("message-input");

  if (!emojiButton || !messageInput) {
    console.warn("Emoji button or message input not found.");
    return;
  }

  // Initialize the Emoji Button picker

  const picker = new EmojiButton({
    position: "bottom-start", // Adjust the position as needed
  });

  // When an emoji is selected, insert it into the message input at the cursor position

  picker.on("emoji", (emoji) => {
    insertAtCursor(messageInput, emoji);
  });

  // Toggle the picker when clicking the emoji button

  emojiButton.addEventListener("click", (e) => {
    e.stopPropagation();
    picker.togglePicker(emojiButton);
  });

  // On any document click, hide the picker only if it is currently visible.
  // We check if the internal picker element (picker.picker) exists.

  document.addEventListener("click", () => {
    if (picker.picker) {
      try {
        picker.hidePicker();
      } catch (err) {
        console.warn("Error hiding emoji picker:", err);
      }
    }
  });

  // Helper function to insert text at the current cursor position in an input/textarea

  function insertAtCursor(input, text) {
    const startPos = input.selectionStart;
    const endPos = input.selectionEnd;
    const beforeValue = input.value.substring(0, startPos);
    const afterValue = input.value.substring(endPos);
    input.value = beforeValue + text + afterValue;

    // Move the cursor after the inserted emoji

    const newPos = startPos + text.length;
    input.setSelectionRange(newPos, newPos);
  }
});
