(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("search-input");
    const messageContainer = document.getElementById("message-container");

    if (!searchInput || !messageContainer) {
      console.warn("Search input or message container not found.");
      return;
    }

    // Listen for input events on the search field

    searchInput.addEventListener("input", function () {
      const searchTerm = searchInput.value.toLowerCase().trim();

      // Get all the message <li> elements

      const messages = messageContainer.getElementsByTagName("li");

      Array.from(messages).forEach((message) => {
        // Use the entire text content of the message for matching.

        const messageText = message.textContent.toLowerCase();
        if (messageText.indexOf(searchTerm) !== -1) {
          message.style.display = ""; // Show message
        } else {
          message.style.display = "none"; // Hide message
        }
      });
    });
  });
})();
