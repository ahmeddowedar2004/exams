import Swal from "sweetalert2";
import { getLocStore, topRightSwal } from "./myFramework";
import { checkAuth } from "./auth";
checkAuth;

const uid = getLocStore("uid");
// Extract the exam ID from the URL
const examId = location.pathname.split("/")[2];

// DOM Elements
const examType = document.getElementById("examType");
const examForm = document.getElementById("examForm");
const questionsContainer = document.getElementById("questionsContainer");

// Fetch Exam Data from Backend
async function fetchExamData() {
  try {
    const response = await fetch(`/exams/${examId}`);
    if (!response.ok) throw new Error("Failed to fetch exam data.");

    const examData = await response.json();

    // Validate the owner ID
    if (examData.exam.ownerId !== uid) {
      Swal.fire({
        title: "Access restricted!",
        icon: "error",
        text: "You do not have permission to edit this exam.",
        showCancelButton: false,
        showCloseButton: false,
        allowOutsideClick: false,
        showConfirmButton: true,
        confirmButtonText: "Profile",
      }).then((res) => {
        res.isConfirmed ? location.replace("/profile") : location.replace("/");
      });
      return;
    }

    populateExamForm(examData.exam);
  } catch (error) {
    console.error("Error fetching exam data:", error);
    topRightSwal("Failed to load exam. Try again later.", "error");
  }
}

let questionCount = 0;
// Populate the form with exam data
function populateExamForm(examData) {
  document.getElementById("examTitle").value = examData.title;
  document.getElementById("examTimer").value = examData.timer;
  examType.value =
    examData.questions[0]?.options.length != 0
      ? "multiple-choice"
      : "true/false";

  // Clear existing questions
  questionsContainer.innerHTML = "";

  // Populate questions
  examData.questions.forEach((question, index) => {
    const questionDiv = document.createElement("div");
    questionDiv.className =
      "question-item border border-gray-300 rounded-lg p-4 space-y-2";

    questionDiv.innerHTML = `
        <label class="block font-semibold text-gray-600">سؤال ${
          index + 1
        }</label>
        <input 
          type="text" 
          name="questionText${index + 1}" 
          class="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-500" 
          placeholder="إدخل السؤال" 
          value="${question.questionText}" 
          required>
      `;

    if (question.options.length != 0) {
      questionDiv.innerHTML += `<label class="block font-semibold text-gray-600">الاختيارات</label>`;
      question.options.forEach((option, optIndex) => {
        questionDiv.innerHTML += `
            <input 
              type="text" 
              name="option${optIndex + 1}_${index + 1}" 
              class="w-full border border-gray-300 rounded-md p-2 mb-2 focus:ring-2 focus:ring-orange-500" 
              placeholder="اختيار ${optIndex + 1}" 
              value="${option}" 
              required>
          `;
      });

      questionDiv.innerHTML += `
          <label class="block font-semibold text-gray-600">الاجابة الصحيحة</label>
          <input 
            type="text" 
            name="correctAnswer_${index + 1}" 
            class="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-500" 
            value="${question.correctAnswer}" 
            required>
        `;
    } else {
      // True/False
      questionDiv.innerHTML += `
          <label class="block font-semibold text-gray-600">الاجابة</label>
          <div class="flex space-x-4">
            <label>
              <input type="radio" name="correctAnswer_${
                index + 1
              }" value="true" ${
        question.correctAnswer === "true" ? "checked" : ""
      } required> صح
            </label>
            <label>
              <input type="radio" name="correctAnswer_${
                index + 1
              }" value="false" ${
        question.correctAnswer === "false" ? "checked" : ""
      } required> خطأ
            </label>
          </div>
        `;
    }

    questionsContainer.appendChild(questionDiv);
    questionCount++;
  });
}

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

// Form Submission
examForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("examTitle").value;
  const timer = parseInt(document.getElementById("examTimer").value);

  const questions = [...document.querySelectorAll(".question-item")].map(
    (item, index) => {
      const questionText = item.querySelector(
        `[name='questionText${index + 1}']`
      ).value;
      const correctAnswer =
        item.querySelector(`[name='correctAnswer_${index + 1}']:checked`)
          ?.value ||
        item.querySelector(`[name='correctAnswer_${index + 1}']`)?.value;
      if (!correctAnswer) {
        Swal.fire({
          title: "Error",
          text: `Please select a correct answer for Question ${index + 1}`,
          icon: "error",
        });
        throw new Error("Validation failed");
      }

      let options = [];
      if (item.querySelector("[name^='option']")) {
        options = [
          item.querySelector(`[name='option1_${index + 1}']`)?.value,
          item.querySelector(`[name='option2_${index + 1}']`)?.value,
          item.querySelector(`[name='option3_${index + 1}']`)?.value,
          item.querySelector(`[name='option4_${index + 1}']`)?.value,
        ].filter((opt) => opt);
      }
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
      } else {
        return { questionText, correctAnswer, options };
      }
    }
  );

  const updatedExamData = {
    examId,
    title,
    timer,
    questions,
  };

  try {
    const response = await fetch(`/edit-exam`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedExamData),
    });

    if (!response.ok) throw new Error("Failed to update exam.");

    Swal.fire({
      title: "Success",
      text: "Exam updated successfully!",
      icon: "success",
    });
    examForm.reset();
  } catch (error) {
    console.error("Error updating exam:", error);
    topRightSwal("Failed to update exam. Try again later.", "error");
  }
});

// Initialize by fetching the exam data
fetchExamData();
