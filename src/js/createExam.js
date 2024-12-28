import {
  collection,
  addDoc,
  serverTimestamp,
  setDoc,
  arrayUnion,
  doc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase.config";
import Swal from "sweetalert2";
import { $, getLocStore, loadingSwal, topRightSwal } from "./myFramework";
import { checkAuth } from "./auth";
checkAuth;
let currentUser = null;
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = {
      name: user.displayName || "Unknown User",
      email: user.email,
      uid: user.uid,
    };
  } else {
    alert("User not authenticated. Please log in.");
    window.location.href = "/login"; // Redirect to login page
  }
});

// DOM Elements
let questionCount = 0;
const examType = document.getElementById("examType");
const examForm = document.getElementById("examForm");
const questionsContainer = document.getElementById("questionsContainer");
const addQuestionBtn = document.getElementById("addQuestionBtn");

examType.addEventListener("change", () => {
  const type = examType.value;

  if (!type) {
    topRightSwal("Please select an exam type!", "error");
    return;
  }

  examForm.classList.remove("hidden"); // Show the form
  questionsContainer.innerHTML = ""; // Clear any existing questions
  addQuestionBtn.disabled = false; // Enable the "Add Question" button
  questionCount = 0;
});
// Add Question Logic
addQuestionBtn.addEventListener("click", () => {
  const type = examType.value; // Get the selected type
  questionCount++;

  if (!type) {
    alert("Please select an exam type before adding questions!");
    return;
  }

  const questionDiv = document.createElement("div");
  questionDiv.className =
    "question-item border border-gray-300 rounded-lg p-4 space-y-2";

  // Common Question Fields
  questionDiv.innerHTML = `
        <label class="block font-semibold text-gray-600">سؤال ${questionCount} </label>
        <input 
          type="text" 
          name="questionText${questionCount}" 
          class="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-500" 
          placeholder="إدخل السؤال" 
          required>
      `;

  // Type-Specific Fields
  if (type === "multiple-choice") {
    questionDiv.innerHTML += `
          <label class="block font-semibold text-gray-600">الاختيارات</label>
          <input 
            type="text" 
            name="option1_${questionCount}" 
            class="w-full border border-gray-300 rounded-md p-2 mb-2 focus:ring-2 focus:ring-orange-500" 
            placeholder="اختيار 1"
            required>
          <input 
            type="text" 
            name="option2_${questionCount}" 
            class="w-full border border-gray-300 rounded-md p-2 mb-2 focus:ring-2 focus:ring-orange-500" 
            placeholder="اختيار 2"
            required>
          <input 
            type="text" 
            name="option3_${questionCount}" 
            class="w-full border border-gray-300 rounded-md p-2 mb-2 focus:ring-2 focus:ring-orange-500" 
            placeholder="اختيار 3"
            required>
          <input 
            type="text" 
            name="option4_${questionCount}" 
            class="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-500" 
            placeholder="اختيار 4"
            required>
          <label class="block font-semibold text-gray-600">الاجابة الصحيحة</label>
          <input 
            type="text" 
            name="correctAnswer_${questionCount}" 
            class="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-500" 
            placeholder="ادخل الاجابة الصحيحة" 
            required>
        `;
  } else if (type === "true/false") {
    questionDiv.innerHTML += `
          <label class="block font-semibold text-gray-600">الاجابة</label>
          <div class="flex space-x-4">
            <label>
              <input type="radio" name="correctAnswer_${questionCount}" value="true" required> صح
            </label>
            <label>
              <input type="radio" name="correctAnswer_${questionCount}" value="false" required> خطأ
            </label>
          </div>
        `;
  }

  // Append the question to the container
  questionsContainer.appendChild(questionDiv);
});

document.querySelectorAll(".subject-radio").forEach((el) => {
  el.addEventListener("click", () => {
    if (
      document.querySelector("[name='subjectname']:checked").value == "custom"
    ) {
      document.getElementById("examTitle").disabled = false;
      document.getElementById("subject").value = "";
      document.getElementById("subject").disabled = true;
    } else {
      document.getElementById("examTitle").disabled = true;
      document.getElementById("examTitle").value = "";
      document.getElementById("subject").disabled = false;
    }
  });
});

// Form Submission
examForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const submitBtn = document.getElementById("submitExam");
  submitBtn.setAttribute("disabled", "disabled");
  loadingSwal("يتم الارسال...");
  // Collect exam details
  const title = document.getElementById("examTitle").value;
  const timer = parseInt(document.getElementById("examTimer").value);

  // Collect questions data
  const questions = [...document.querySelectorAll(".question-item")].map(
    (item, index) => {
      const questionText = item.querySelector(
        `[name='questionText${index + 1}']`
      ).value;
      const correctAnswer =
        item.querySelector(`[name='correctAnswer_${index + 1}']:checked`)
          ?.value ||
        item.querySelector(`[name='correctAnswer_${index + 1}']`)?.value;

      let options = [];
      if (item.querySelector("[name^='option']")) {
        // For multiple choice questions
        options = [
          item.querySelector(`[name='option1_${index + 1}']`)?.value,
          item.querySelector(`[name='option2_${index + 1}']`)?.value,
          item.querySelector(`[name='option3_${index + 1}']`)?.value,
          item.querySelector(`[name='option4_${index + 1}']`)?.value,
        ].filter((opt) => opt); // Filter out empty options

        // Validation: Check if the correct answer matches one of the options
        if (!options.includes(correctAnswer)) {
          Swal.fire({
            title: "Error",
            text: `The correct answer for Question ${
              index + 1
            } must match one of the provided options.`,
            icon: "error",
          });
          throw new Error(
            `Validation failed for Question ${
              index + 1
            }: Correct answer does not match options.`
          );
        }
      }

      return { questionText, correctAnswer, options };
    }
  );
  const subjectName = $("#subject").val().value || $("#examTitle").val().value;
  if (subjectName == "") {
    Swal.fire({
      title: "Error",
      text: `اسم الماده فارغ`,
      icon: "error",
    });
    throw new Error(`اسم الماده فارغ.`);
  }
  // Prepare the exam data for submission
  const examData = {
    title,
    timer,
    questions,
    isApproved: false, // Set to false, awaiting admin approval
    createdAt: serverTimestamp(),
    ownerId: currentUser.uid,
    ownerName: currentUser.name,
    ownerEmail: currentUser.email,
    subjectName: subjectName,
  };

  // Submit the exam data to Firestore
  try {
    await addDoc(collection(db, "exams"), examData).then(async (docu) => {
      await updateDoc(doc(db, "users", getLocStore("uid")), {
        createdExams: arrayUnion(docu.id),
      }).then(() => {
        Swal.fire({
          text: "تم انشاء الاختبار بنجاح",
          icon: "success",
          html: `
  <div class="text-center space-y-4">
    <p class="text-lg font-semibold text-gray-800">
      تم انشاء الاختبار بنجاح وتم ارساله الى المسؤل للمراجعه
    </p>
    <p class="text-sm text-gray-600">
      الرجاء الانتظار حتى يتم مراجعته ليبدأ بالظهور
    </p>
    <div class="mt-4 p-4 bg-gray-100 rounded-md shadow-md">
      <p class="text-sm font-medium text-gray-700 mb-2">رابط الاختبار:</p>
      <a 
        href="https://exams.domaz.tech/exam/${docu.id}" 
        class="block text-blue-600 hover:underline break-words"
        target="_blank"
      >
        https://exams.domaz.tech/exam/${docu.id}
      </a>
      <button 
        id="copy" 
        data-link="https://exams.domaz.tech/exam/${docu.id}" 
        class="mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md shadow"
      >
        نسخ الرابط
      </button>
    </div>
  </div>
`,
          showConfirmButton: true,
          confirmButtonText: "حسناً",
          allowEscapeKey: false,
          allowOutsideClick: false,
          showCancelButton: false,
          showCloseButton: false,
          didOpen: () => {
            document.getElementById("copy").addEventListener("click", () => {
              const dataToCopy = document
                .getElementById("copy")
                .getAttribute("data-link");
              navigator.clipboard
                .writeText(dataToCopy) // Use writeText instead of write
                .then(() => {
                  topRightSwal(`${dataToCopy} تم نسخ الرابط بنجاح `);
                })
                .catch((err) => {
                  topRightSwal(`حدث خطأ أثناء نسخ الرابط ${err}`, "error");
                });
            });
          },
        }).then((res) => {
          if (res.isConfirmed) {
            location.reload();
          }
        });
      });
    });

    examForm.reset(); // Optionally, reset the form after submission
  } catch (error) {
    console.error("Error creating exam:", error);
    topRightSwal("Failed to create exam. Try again later.", "error");
  }
});
