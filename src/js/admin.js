import Swal from "sweetalert2";
import { db, auth } from "../firebase.config";
import {
  onAuthStateChanged,
  getIdTokenResult,
  getIdToken,
  signOut,
} from "firebase/auth";
import {
  getDocs,
  collection,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  arrayUnion,
} from "firebase/firestore";
import { loadingSwal, topRightSwal } from "./myFramework";
import { decryptData, encryptData } from "../encrypt-js";

async function logoutUser() {
  try {
    await signOut(auth).then(() => {
      localStorage.clear();
      sessionStorage.clear();
      location.href = "/login";
    });
  } catch (error) {
    topRightSwal(`Error while logging out: ${error}`, "error");
  }
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const idToken = await getIdToken(auth.currentUser, true); // Force refresh
    fetch("/checkAdmin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: idToken }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        if (!data.isAdmin) {
          Swal.fire({
            icon: "error",
            title: "Access Denied",
            text: "You are not authorized to access this page.",
            showCancelButton: false,
            allowOutsideClick: false,
            showCloseButton: false,
            showConfirmButton: true,
            confirmButtonText: "Return",
          }).then(() => {
            window.location.href = "/"; // Redirect after alert
          });
        } else {
          loadUsers();
        }
      })
      .catch((error) => {
        console.error("Error accessing admin:", error);
      });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  // Navigation Links
  const manageUsersLink = document.getElementById("approve-users-link");
  const manageExamsLink = document.getElementById("manage-exams-link");

  // Sections
  const manageUsersSection = document.getElementById("approve-users-section");
  const manageExamsSection = document.getElementById("manage-exams-section");

  // Switch between sections
  manageUsersLink.addEventListener("click", () => {
    switchSection(manageUsersSection);
  });

  manageExamsLink.addEventListener("click", () => {
    loadExams();
    switchSection(manageExamsSection);
  });
  function switchSection(targetSection) {
    document.querySelectorAll(".admin-section").forEach((section) => {
      section.classList.add("hidden");
    });
    targetSection.classList.remove("hidden");
  }

  // Exam Approvals
  const examTable = document.getElementById("examTable");

  examTable.addEventListener("click", async (e) => {
    if (e.target.classList.contains("approve-exam")) {
      handleExamApproval(e.target.closest("tr").dataset.id, "approve");
    } else if (e.target.classList.contains("reject-exam")) {
      handleExamApproval(e.target.closest("tr").dataset.id, "reject");
    } else if (e.target.classList.contains("view-exam")) {
      viewExamDetails(e.target.closest("tr").dataset.id);
    } else if (e.target.classList.contains("test-exam")) {
      testExam(e.target.closest("tr").dataset.id);
    }
  });

  const logoutBtn = document.getElementById("logout-btn");
  logoutBtn.addEventListener("click", async () => {
    logoutUser();
  });
});

async function loadUsers() {
  try {
    loadingSwal("Loading users...");
    const querySnapshot = await getDocs(collection(db, "users"));
    const userTableBody = document.querySelector("#userTable tbody");
    userTableBody.innerHTML = ""; // Clear the table body

    querySnapshot.forEach((docu) => {
      const user = docu.data();
      console.log(user);
      if (!user.approved) {
        // Create a table row
        const row = document.createElement("tr");
        row.dataset.id = docu.id;

        // Name cell
        const nameCell = document.createElement("td");
        nameCell.className = "px-4 py-2 border";
        nameCell.textContent = decryptData(user.name) || "N/A";
        row.appendChild(nameCell);

        // Email cell
        const emailCell = document.createElement("td");
        emailCell.className = "px-4 py-2 border";
        emailCell.textContent = decryptData(user.email) || "N/A";
        row.appendChild(emailCell);

        // Phone cell
        const phoneCell = document.createElement("td");
        phoneCell.className = "px-4 py-2 border";
        phoneCell.textContent = decryptData(user.phoneNumber) || "N/A";
        row.appendChild(phoneCell);

        // Actions cell
        const actionsCell = document.createElement("td");
        actionsCell.className = "px-4 py-2 border flex space-x-2";

        // Approve button
        const approveBtn = document.createElement("button");
        approveBtn.className =
          "approve-user bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600";
        approveBtn.textContent = "Approve";
        approveBtn.onclick = async () => {
          try {
            await updateDoc(doc(db, "users", docu.id), { approved: true });
            loadUsers(); // Refresh the table
          } catch (error) {
            console.error("Error approving user:", error);
          }
        };
        actionsCell.appendChild(approveBtn);

        const detailsBtn = document.createElement("button");
        detailsBtn.className =
          "approve-user bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600";
        detailsBtn.textContent = "Details";
        detailsBtn.setAttribute("data-info", JSON.stringify(user));
        detailsBtn.onclick = async () => {
          Swal.fire({
            title: "User Details",
            html: `
                <div class="space-y-2 text-xl font-semibold">
                <p class="${
                  user.approved ? "text-green-600" : "text-red-600"
                }"><strong>approved:</strong> ${user.approved}</p>
                  <p><strong>Name:</strong> ${decryptData(user.name)}</p>
                  <p><strong>Email:</strong> ${decryptData(user.email)}</p>
                  <p><strong>Phone:</strong> ${decryptData(
                    user.phoneNumber
                  )}</p>
                  <p><strong>ferqa:</strong> ${decryptData(user.ferqa)}</p>
                  <p><strong>gender:</strong> ${decryptData(user.gender)}</p>
                  <p><strong>City:</strong> ${decryptData(user.governorate)}</p>
                  <p><strong>qesm:</strong> ${decryptData(user.qesm)}</p>
                  <p><strong>role:</strong> ${user.role}</p>
                  <p><strong>uid:</strong> ${user.uid}</p>
                  <p><strong>uniID:</strong> ${decryptData(user.uniId)}</p>
                  <ul>
                  <li>${user.createdExams
                    .map((exam) => `<li>${exam}</li>`)
                    .join("")}</li>
                  </ul>
                  <p><strong>solvedExams:</strong> ${user.solvedExams}</p>
                </div>
              `,
          });
        };
        actionsCell.appendChild(detailsBtn);

        // Reject button
        const rejectBtn = document.createElement("button");
        rejectBtn.className =
          "reject-user bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600";
        rejectBtn.textContent = "Reject";
        rejectBtn.onclick = async () => {
          try {
            await deleteDoc(doc(db, "users", docu.id));
            loadUsers(); // Refresh the table
          } catch (error) {
            console.error("Error rejecting user:", error);
          }
        };
        actionsCell.appendChild(rejectBtn);

        row.appendChild(actionsCell);
        userTableBody.appendChild(row);
      }
    });
    topRightSwal("Users loaded successfully", "success");
  } catch (error) {
    console.error("Error loading users:", error);
  }
}

async function loadExams() {
  loadingSwal("Loading Exams...");
  const exams = await getDocs(collection(db, "exams"));
  const examTableBody = document.querySelector("#examTable tbody");
  examTableBody.innerHTML = ""; // Clear the table body
  exams.docs.forEach((doc) => {
    const exam = doc.data();
    console.log(exam);
    if (exam.isApproved) {
      return;
    }
    const row = document.createElement("tr");
    row.dataset.id = doc.id;

    // Name cell
    const nameCell = document.createElement("td");
    nameCell.className = "px-4 py-2 border";
    nameCell.textContent = exam.ownerName || "N/A";
    row.appendChild(nameCell);

    // Creator cell
    const creatorCell = document.createElement("td");
    creatorCell.className = "px-4 py-2 border";
    creatorCell.textContent = exam.ownerEmail || "N/A";
    row.appendChild(creatorCell);
    // Subject cell

    const subjectCell = document.createElement("td");
    subjectCell.className = "px-4 py-2 border";
    subjectCell.textContent = exam.subjectName || "N/A";
    row.appendChild(subjectCell);

    // Actions cell
    const actionsCell = document.createElement("td");
    actionsCell.className = "px-4 py-2 border flex space-x-2";

    // Approve button
    const approveBtn = document.createElement("button");
    approveBtn.className =
      "approve-exam bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600";
    approveBtn.textContent = "Approve";
    actionsCell.appendChild(approveBtn);

    // Reject button
    const rejectBtn = document.createElement("button");
    rejectBtn.className =
      "reject-exam bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600";
    rejectBtn.textContent = "Reject";
    actionsCell.appendChild(rejectBtn);

    // View button
    const viewBtn = document.createElement("button");
    viewBtn.className =
      "view-exam bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600";
    viewBtn.textContent = "View";
    actionsCell.appendChild(viewBtn);

    // Test button
    const testBtn = document.createElement("button");
    testBtn.className =
      "test-exam bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600";
    testBtn.textContent = "Test";
    actionsCell.appendChild(testBtn);

    row.appendChild(actionsCell);
    examTableBody.appendChild(row);
  });
  topRightSwal("Exams loaded successfully", "success");
}
// Function to handle exam approval/rejection
async function handleExamApproval(examId, action) {
  const confirmation = await Swal.fire({
    title: action === "approve" ? "Approve Exam?" : "Reject Exam?",
    text: "Are you sure you want to proceed?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: action === "approve" ? "#28a745" : "#d33",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Yes, proceed",
  });

  if (confirmation.isConfirmed) {
    try {
      if (action === "approve") {
        loadingSwal("Processing...");
        const docRef = doc(db, "exams", examId);

        await updateDoc(docRef, {
          isApproved: action === "approve",
        }).then(async () => {
          const examData = await getDoc(doc(db, "exams", examId));
          const data = examData.data();
          const subjectName = data.subjectName;
          await setDoc(doc(db, "subjects", subjectName), {
            exams: arrayUnion(examId),
            name: subjectName,
          });
          topRightSwal("Exam has been approved successfully", "success");
          loadExams();
        });
      } else {
        loadingSwal("Processing...");
        const docRef = doc(db, "exams", examId);
        await deleteDoc(docRef).then(() => {
          topRightSwal("Exam has been rejected successfully", "success");
          loadExams();
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", error.message, "error");
    }
  }
}

// Function to view exam details
async function viewExamDetails(examId) {
  try {
    const response = await fetch(`/admin/exams/${examId}`);
    const exam = await response.json();
    console.log("exam: ", exam);

    if (!response.ok) throw new Error("Failed to fetch exam details");

    // Build the HTML content for the popup
    let content = `
        <div>
          <h3 class="text-lg font-bold mb-4">${exam.subjectName}</h3>
          <div class="space-y-4">`;

    exam.questions.forEach((question, index) => {
      content += `
          <div>
            <p class="font-bold text-xl">${index + 1}. ${
        question.questionText
      }</p>
            <ul class="list-disc pl-6">
              ${question.options
                .map(
                  (option, i) => `<li class="${
                    option === question.correctAnswer
                      ? "text-green-600"
                      : "text-red-600"
                  }
                      font-bold text-xl">
                      ${option}
                    </li>`
                )
                .join("")}
            </ul>
          </div>`;
    });

    content += `
          </div>
        </div>
      `;

    // Display the popup
    Swal.fire({
      title: "Exam Details",
      html: content,
      width: "800px",
      showCloseButton: true,
    });
  } catch (error) {
    Swal.fire("Error", error.message, "error");
  }
}

// Function to test the exam
function testExam(examId) {
  window.open(`/testExam/${examId}`, "_blank");
}
