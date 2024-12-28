import { auth } from "../firebase.config";
import { onAuthStateChanged } from "firebase/auth";
import Swal from "sweetalert2";

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const idTokenResult = await user.getIdTokenResult();

    if (idTokenResult.claims.admin) {
      // Create input field and button
      const input = document.createElement("input");
      input.id = "assignAdminInput";
      input.placeholder = "Enter UID";
      input.type = "text";
      input.required = true;
      input.className = "border-2 border-gray-300 p-2 rounded-lg";

      const button = document.createElement("button");
      button.id = "assignAdminBtn";
      button.textContent = "Assign Admin";
      button.className = "bg-green-500 text-white p-2 rounded-lg";

      document.body.append(input, button);

      // Button click handler
      button.addEventListener("click", async () => {
        const uid = input.value.trim();
        if (!uid) {
          return Swal.fire({
            icon: "error",
            title: "Error",
            text: "Please enter a user ID",
          });
        }

        const confirmResult = await Swal.fire({
          title: "Assign Admin",
          text: "Are you sure you want to assign this user as an admin?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes",
        });

        if (confirmResult.isConfirmed) {
          try {
            const response = await fetch("/assignAdmin", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idTokenResult.token}`,
              },
              body: JSON.stringify({ uid }),
            });

            const data = await response.json();

            if (response.ok) {
              Swal.fire({
                icon: "success",
                title: "Success",
                text: "User has been assigned as an admin",
              });
            } else {
              Swal.fire({
                icon: "error",
                title: "Error",
                text: data.error || "Failed to assign user as an admin",
              });
            }
          } catch (error) {
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "Network error. Please try again later.",
            });
            console.error("Error:", error);
          }
        }
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Access Denied",
        text: "You must be an admin to access this page.",
      }).then(() => {
        window.location.href = "/";
      });
    }
  } else {
    Swal.fire({
      title: "Not Logged In",
      icon: "error",
      text: "Please log in to access this page.",
      confirmButtonText: "Log In",
    }).then(() => {
      window.location.href = "/login.html";
    });
  }
});
