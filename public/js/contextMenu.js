let contextMenu;

function createContextMenu() {
  if (!contextMenu) {
    contextMenu = document.createElement("div");
    contextMenu.id = "context-menu";
    contextMenu.style.position = "absolute";
    contextMenu.style.display = "none";
    contextMenu.style.background = "#fff";
    contextMenu.style.border = "1px solid #ccc";
    contextMenu.style.boxShadow = "2px 2px 6px rgba(0,0,0,0.2)";
    contextMenu.style.zIndex = 1000;
    document.body.appendChild(contextMenu);
  }
}

function showContextMenuAt(x, y, options) {
  if (!contextMenu) createContextMenu(); // Ensure the menu is initialized

  contextMenu.innerHTML = "";
  let ul = document.createElement("ul");
  ul.style.listStyle = "none";
  ul.style.margin = 0;
  ul.style.padding = 0;

  options.forEach((option) => {
    let li = document.createElement("li");
    li.textContent = option.label;
    li.style.padding = "8px 12px";
    li.style.cursor = "pointer";
    li.addEventListener("click", () => {
      option.action();
      hideContextMenu();
    });
    li.addEventListener("mouseenter", () => (li.style.background = "#eee"));
    li.addEventListener(
      "mouseleave",
      () => (li.style.background = "transparent")
    );
    ul.appendChild(li);
  });

  contextMenu.appendChild(ul);
  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;
  contextMenu.style.display = "block";
}

function hideContextMenu(e) {
  if (
    e &&
    (e.target.closest("#context-menu") || e.target.id === "attachment-button")
  ) {
    return;
  }
  if (contextMenu) {
    contextMenu.style.display = "none";
  }
}

// Call createContextMenu when the script loads
createContextMenu();

document.addEventListener("click", window.hideContextMenu);

ul.style.listStyle = "none";
ul.style.margin = 0;
ul.style.padding = 0;
options.forEach(function (option) {
  let li = document.createElement("li");
  li.textContent = option.label;
  li.style.padding = "8px 12px";
  li.style.cursor = "pointer";
  li.addEventListener("click", function () {
    option.action();
    hideContextMenu();
  });
  li.addEventListener("mouseenter", function () {
    li.style.background = "#eee";
  });
  li.addEventListener("mouseleave", function () {
    li.style.background = "transparent";
  });
  ul.appendChild(li);
});
contextMenu.appendChild(ul);
contextMenu.style.left = x + "px";
contextMenu.style.top = y + "px";
contextMenu.style.display = "block";

function hideContextMenu(e) {
  if (
    e &&
    (e.target.closest("#context-menu") || e.target.id === "attachment-button")
  ) {
    return;
  }
  if (contextMenu) {
    contextMenu.style.display = "none";
  }
}

// This helper creates the context menu options for a given message element.

function showMessageContextMenu(
  e,
  messageElement,
  username,
  deleteMessageCallback,
  selectedMessages,
  deleteSelectedMessagesCallback,
  selectAllMessagesCallback
) {
  let options = [];
  if (messageElement.dataset.username === username) {
    options.push({
      label: "Delete Message",
      action: function () {
        let messageId = messageElement.getAttribute("data-id");
        if (messageId) {
          deleteMessageCallback(messageId, messageElement);
        }
      },
    });
  }
  if (selectedMessages.has(messageElement)) {
    options.push({
      label: "Deselect Message",
      action: function () {
        messageElement.classList.remove("selected");
        selectedMessages.delete(messageElement);
      },
    });
  } else {
    options.push({
      label: "Select Message",
      action: function () {
        messageElement.classList.add("selected");
        selectedMessages.add(messageElement);
      },
    });
  }
  if (selectedMessages.size > 0) {
    options.push({
      label: "Delete Selected",
      action: function () {
        deleteSelectedMessagesCallback();
      },
    });
    options.push({
      label: "Select All",
      action: function () {
        selectAllMessagesCallback();
      },
    });
  }
  options.push({ label: "Cancel", action: function () {} });
  showContextMenuAt(e.pageX, e.pageY, options);
}
