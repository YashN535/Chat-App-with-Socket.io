document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "signin.html";
    return;
  }

  const usernameDisplay = document.getElementById("username");
  const profilePicDisplay = document.getElementById("profile-pic-display");
  const profilePicForm = document.getElementById("profile-pic-form-profile");
  const profilePicInput = document.getElementById("profile-pic-input-profile");

  try {
    const response = await fetch("/auth/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch profile");
    }

    const data = await response.json();

    if (data.username) {
      usernameDisplay.textContent = data.username;
    }

    profilePicDisplay.src = data.profilePic
      ? `/${data.profilePic}`
      : "/uploads/default-profile-pic.png";
  } catch (error) {
    console.error("Error fetching profile:", error);
    alert("Error loading profile. Please try again.");
  }

  // Handle profile picture upload

  profilePicForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const file = profilePicInput.files[0];
    if (!file) {
      alert("Please select an image file.");
      return;
    }

    const formData = new FormData();
    formData.append("profilePic", file);

    try {
      const uploadResponse = await fetch("/auth/uploadProfilePic", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      const uploadData = await uploadResponse.json();

      if (uploadData.profilePic) {
        profilePicDisplay.src = `/${uploadData.profilePic}`;
        alert(uploadData.message);
      } else {
        alert("Error uploading profile picture.");
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      alert("Error uploading profile picture. Please try again.");
    }
  });
});
