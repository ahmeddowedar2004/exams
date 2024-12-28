import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase.config";
import Swal from "sweetalert2";
import { checkAuth } from "./auth";
import { $ } from "./myFramework";
checkAuth;

function createExamCard(exam) {
  return `
    <div class="bg-white p-4 shadow-md rounded-md hover:shadow-lg transition duration-300">
      <h3 class="text-lg font-semibold">${exam.subjectName}</h3>
      <p>Type: ${exam.type || "Unknown"}</p>
      <button
        data-id="${exam.id}"
        class="viewExamBtn mt-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
      >
        View Exam
      </button>
    </div>`;
}

// Retrieve Subjects
async function loadSubjects() {
  const subjectsContainer = document.getElementById("subjectsContainer");
  subjectsContainer.innerHTML = ""; // Clear container before loading

  try {
    const examsQuery = query(
      collection(db, "exams"),
      where("isApproved", "==", true)
    );
    const querySnapshot = await getDocs(examsQuery);

    if (querySnapshot.empty) {
      subjectsContainer.innerHTML = `<p class="text-gray-500 text-center">عذراً لا يوجد اختبارات في الوقت الحالي</p>`;
      return;
    }

    const subjectGroups = {};

    querySnapshot.forEach((doc) => {
      const exam = { id: doc.id, ...doc.data() };

      // Validate subjectName
      if (!exam.subjectName || typeof exam.subjectName !== "string") {
        console.warn(`Invalid subject name for exam ID: ${exam.id}`);
        return;
      }

      // Group exams by subjectName
      if (!subjectGroups[exam.subjectName]) {
        subjectGroups[exam.subjectName] = [];
      }
      subjectGroups[exam.subjectName].push(exam);
    });

    // Create cards for each subject
    for (const [subjectName, exams] of Object.entries(subjectGroups)) {
      const subjectContainer = document.createElement("div");
      subjectContainer.className = "p-4 border rounded-md bg-gray-100";
      subjectContainer.innerHTML = `
        <h2 class="text-xl font-bold mb-4">${subjectName}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${exams.map(createExamCard).join("")}
        </div>
      `;
      subjectsContainer.appendChild(subjectContainer);
    }

    // Attach event listeners to buttons
    document.querySelectorAll(".viewExamBtn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const examId = e.target.getAttribute("data-id");
        viewExams(examId);
      });
    });
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "Failed to load subjects. Try again later.",
    });
    console.error("Error fetching subjects: ", error);
  }
}

// Handle View Exams
function viewExams(subjectId) {
  Swal.fire({
    title: "Loading Exams...",
    text: "Please wait.",
    didOpen: () => Swal.showLoading(),
  });
  setTimeout(() => {
    window.location.href = `/exam/${subjectId}`;
  }, 1500);
}

// Load subjects on page load
document.addEventListener("DOMContentLoaded", loadSubjects);
