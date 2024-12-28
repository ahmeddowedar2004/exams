import Swal from "sweetalert2";
import { decryptData } from "../../src/js/encrypt-js";

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

async function deleteUser(userId) {
  const token = sessionStorage.getItem("token");
  if (!token) {
    alert("Unauthorized: Please log in.");
    return;
  }

  const confirmation = confirm("Are you sure you want to delete this user?");
  if (!confirmation) return;

  const response = await fetch(`/admin/users/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    alert("User deleted successfully.");
    window.location.reload();
  } else {
    alert("Failed to delete user.");
  }
}

async function showDetails(userId) {
  console.log("Start fetching");
  const response = await fetch(`/admin/users/details/${userId}`, {
    method: "GET",
  });

  if (response.ok) {
    try {
      const user = await response.json();
      console.log(user);
      Swal.fire({
        title: "User Details",
        html: `
            <div class="space-y-2 text-xl font-semibold">
              <p class="${
                user.approved ? "text-green-600" : "text-red-600"
              }"><strong>Approved:</strong> ${user.approved}</p>
              <p><strong>Name:</strong> ${decryptData(user.name)}</p>
              <p><strong>Email:</strong> ${decryptData(user.email)}</p>
              <p><strong>Phone:</strong> ${decryptData(user.phoneNumber)}</p>
              <p><strong>Ferqa:</strong> ${decryptData(user.ferqa)}</p>
              <p><strong>Gender:</strong> ${decryptData(user.gender)}</p>
              <p><strong>City:</strong> ${decryptData(user.governorate)}</p>
              <p><strong>Qesm:</strong> ${decryptData(user.qesm)}</p>
              <p><strong>Role:</strong> ${user.role}</p>
              <p><strong>UID:</strong> ${user.uid}</p>
              <p><strong>UniID:</strong> ${decryptData(user.uniId)}</p>
              <ul>
                ${user.createdExams.map((exam) => `<li>${exam}</li>`).join("")}
              </ul>
              <p><strong>Solved Exams:</strong> ${user.solvedExams}</p>
            </div>
          `,
      });
    } catch (error) {
      console.error("Error parsing JSON:", error.message);
      Swal.fire("Error", "Failed to parse server response", "error");
    }
  } else {
    // Handle non-OK responses
    const errorMessage = `Failed to fetch user details. Server responded with ${response.status}: ${response.statusText}`;
    console.error(errorMessage);
    Swal.fire("Error", errorMessage, "error");
  }
}

document.querySelectorAll(".detailsBtn").forEach((btn) => {
  btn.addEventListener("click", () => {
    showDetails(btn.getAttribute("data-id"));
  });
});
document.querySelectorAll(".deleteBtn").forEach((btn) => {
  btn.addEventListener("click", () => {
    deleteUser(btn.getAttribute("data-id"));
  });
});
