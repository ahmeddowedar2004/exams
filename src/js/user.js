import {
  reauthenticateWithCredential,
  updatePassword,
  onAuthStateChanged,
  EmailAuthProvider,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { inputsAnimation } from "./inputFocusEffects";

import { db, auth, app } from "../firebase.config";
import Swal from "sweetalert2";
import { getLocStore, topRightSwal, alertProblem } from "./myFramework";

import { checkAuth } from "./auth";
import { decryptData, encryptData } from "./encrypt-js";
checkAuth;

let currentUser;

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    loadExams();
  }
});

// Function: Load Exams
async function loadExams() {
  const examsRef = collection(db, "exams");
  const q = query(examsRef, where("ownerId", "==", currentUser.uid));
  const querySnapshot = await getDocs(q);

  const examList = document.getElementById("examList");
  examList.innerHTML = ""; // Clear previous data

  querySnapshot.forEach((doc) => {
    const exam = doc.data();
    const examDiv = document.createElement("div");
    examDiv.className =
      "p-4 bg-gray-100 rounded-md shadow flex justify-between items-center";

    examDiv.innerHTML = `
    <div>
      <h3 class="text-lg font-medium">${exam.title}</h3>
      <p class="text-sm text-gray-600">Status: ${
        exam.isApproved ? "Approved" : "Pending"
      }</p>
    </div>
    <div>
      <button data-id='${
        doc.id
      }' class="editExamBtn px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 mr-2">Edit</button>
      <button data-id='${
        doc.id
      }' class="deleteExamBtn px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600">Delete</button>
    </div>
  `;

    examList.appendChild(examDiv);
  });
  document.querySelectorAll(".editExamBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      editExam(btn.getAttribute("data-id"));
    });
  });
  document.querySelectorAll(".deleteExamBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      deleteExam(btn.getAttribute("data-id"));
    });
  });
}

// Function: Edit Exam
function editExam(examId) {
  location.href = `/edit-exam/${examId}`;
}

// Function: Delete Exam
async function deleteExam(examId) {
  Swal.fire({
    title: "Are you sure?",
    text: "This action cannot be undone.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Delete",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, "exams", examId));
        Swal.fire("Deleted!", "Your exam has been deleted.", "success");
        loadExams();
      } catch (error) {
        Swal.fire("Error", error.message, "error");
      }
    }
  });
}

async function loadSolvedExams(userId) {
  try {
    const response = await fetch(`/get-solved-exams/${userId}`);
    const result = await response.json();
    console.log(result);
    if (result.success) {
      const solvedExamsContainer = document.getElementById(
        "solvedExamsContainer"
      );
      solvedExamsContainer.innerHTML = ""; // Clear existing content

      result.solvedExams.forEach(async (examDataL, i) => {
        const resultId = examDataL.resultId;
        const examId = examDataL.examData.examId;
        const examRef = await getDoc(doc(db, "exams", examId));
        if (!examRef.exists()) {
          return;
        }
        const examData = examRef.data();
        const examElement = document.createElement("div");
        const exam = examDataL.examData;
        examElement.className = "solved-exam";
        const percentage = (exam.score / exam.questions.length) * 100;
        const scoreColor = percentage > 70 ? "text-green-500" : "text-red-500";

        examElement.innerHTML = ` 
          <div class="bg-white rounded-lg shadow-md p-4 mb-4 font-semibold text-lg ">
            <div class="text-xl font-bold mb-2 "><span class="font-medium">اسم المادة:</span> ${
              examData.subjectName
            }</div>
            <div class="mb-1">
              <span class="font-medium">رقم الاختبار:</span> ${exam.title}
            </div>
            <div class="mb-1 ${scoreColor}">
              النتيجة: ${exam.score} / ${exam.questions.length}
            </div>
            <div class="mb-1">
              <span class="font-medium">تم الحل في:</span> ${new Date(
                exam.solvedAt
              ).toLocaleString()}
            </div>
            <div>
              <span class="font-medium">اسم صاحب الاختبار:</span> ${decryptData(
                examData.ownerName
              )}
            </div>
            <div class="mt-3 Solvedcontainer">
              <button class="showResBtn bg-blue-500 text-white text-lg py-2 px-4 rounded-xl mt-3" data-url="/result/${userId}/${examId}/${resultId}">
                عرض النتائج
              </button>
            </div>
          </div>
        `;

        solvedExamsContainer.appendChild(examElement);

        // Attach event listener to the button after it's created
        const showResBtn = examElement.querySelector(".showResBtn");
        showResBtn.addEventListener("click", () => {
          location.href = showResBtn.getAttribute("data-url");
        });
      });
    } else {
      Swal.fire("Error", result.message, "error");
    }
  } catch (error) {
    console.error("Error fetching solved exams:", error);
    alertProblem(
      "error",
      `حدث خطأ غير متوقع أثناء تحميل الاختبارات المحلوله الرجاء المحاولة مره أخرى أو الاتصال بالمطور
      ${error.message}`,
      "error",
      false,
      true,
      false,
      false
    );
  }
}

// Call the function with the user's ID
await loadSolvedExams(getLocStore("uid"));

document.getElementById("updatePasswordBtn").addEventListener("click", () => {
  Swal.fire({
    title: "Change password",
    html: `<div
                class="input_container flex flex-col w-full gap-3 px-5 py-2">
                <div class="input__container mb-5 ">
                  <input
                    type="password"
                    class="input text-black w-full border-2 border-black bg-transparent py-2 px-5 font-medium text-lg rounded-lg outline-none transition-all duration-300"
                    id="oldPass"
                    autocomplete="password" />
              <i
                class="fa-solid fa-eye eye_icon cursor-pointer text-black absolute right-2 w-7 h-7 text-xl top-3"
                id="showPassword"></i>
  
              <i
                class="fa-solid fa-eye-slash cursor-pointer !hidden eye_icon text-black absolute right-2 w-7 h-7 text-xl top-3"
                id="hidePassword"></i>
                  <label
                    for="oldPass"
                    class="absolute top-1/2 left-4 py-0 px-2 text-lg pointer-events-none z-10 transition-all duration-500 -translate-y-1/2 font-semibold text-black"
                    >Current password</label
                  >
                  <span>Current password</span>
                </div>
                <div class="input__container mb-0 ">
                  <input
                    type="password"
                    class="input relative w-full border-2 border-black bg-transparent py-2 px-5 text-black font-medium text-lg rounded-lg outline-none transition-all duration-300"
                    id="newPass"
                    autocomplete="password" />
              <i
                class="fa-solid fa-eye eye_icon cursor-pointer text-black absolute right-2 w-7 h-7 text-xl top-3"
                id="showPassword"></i>
  
              <i
                class="fa-solid fa-eye-slash cursor-pointer !hidden eye_icon text-black absolute right-2 w-7 h-7 text-xl top-3"
                id="hidePassword"></i>
                  <label
                    for="newPass"
                    class="absolute top-1/2 left-4 py-0 px-2 text-lg pointer-events-none z-10 transition-all duration-500 -translate-y-1/2 font-semibold text-black"
                    >New pass</label
                  >
                  <span>New pass</span>
                </div>
                <div class="input__container mb-0 ">
                  <input
                    type="password"
                    class="input relative w-full border-2 border-black bg-transparent py-2 px-5 text-black font-medium text-lg rounded-lg outline-none transition-all duration-300"
                    id="confNewPass"
                    autocomplete="password" />
  
              <i
                class="fa-solid fa-eye eye_icon cursor-pointer text-black absolute right-2 w-7 h-7 text-xl top-3"
                id="showPassword"></i>
  
              <i
                class="fa-solid fa-eye-slash cursor-pointer !hidden eye_icon text-black absolute right-2 w-7 h-7 text-xl top-3"
                id="hidePassword"></i>
  
                  <label
                    for="confNewPass"
                    class="absolute top-1/2 left-4 py-0 px-2 text-lg pointer-events-none z-10 transition-all duration-500 -translate-y-1/2 font-semibold text-black"
                    >Confirm new pass</label
                  >
                  <span>Confirm new pass</span>
                </div>
              </div>`,
    confirmButtonColor: "orange",
    confirmButtonText: "Change",
    cancelButtonColor: "red",
    cancelButtonText: "Cancel",
    showCancelButton: true,
    didOpen: () => {
      inputsAnimation();
      document.querySelectorAll(".fa-eye").forEach((icon) => {
        icon.addEventListener("click", () => {
          icon.classList.toggle("!hidden");
          icon.nextElementSibling.classList.toggle("!hidden");
          icon.previousElementSibling.type = "text";
        });
      });
      document.querySelectorAll(".fa-eye-slash").forEach((icon) => {
        icon.addEventListener("click", () => {
          icon.classList.toggle("!hidden");
          icon.previousElementSibling.classList.toggle("!hidden");
          icon.previousElementSibling.previousElementSibling.type = "password";
        });
      });
    },
    preConfirm: async () => {
      const currentPassword = document.getElementById("oldPass").value;
      const newPass = document.getElementById("newPass").value;
      const confNewPass = document.getElementById("confNewPass").value;
      if (newPass !== confNewPass) {
        return Swal.showValidationMessage(`Passwords aren't matched`);
      } else if (
        currentPassword.length <= 8 &&
        confNewPass.length <= 8 &&
        newPass.length <= 8
      ) {
        return Swal.showValidationMessage(
          `Passwords are less than 8 characters`
        );
      }

      checkPasswordStrength(currentPassword).then((res) => {
        if (res) {
          checkPasswordStrength(newPass).then((res) => {
            if (res) {
              checkPasswordStrength(confNewPass).then(async (res) => {
                if (res) {
                  try {
                    const user = auth.currentUser;
                    const credential = EmailAuthProvider.credential(
                      user.email,
                      currentPassword
                    );
                    // Aa121212
                    await reauthenticateWithCredential(user, credential);
                    await updatePassword(user, newPass);
                    return topRightSwal("Password changed successfully");
                  } catch (error) {
                    Swal.fire({
                      title: "Error",
                      icon: "error",
                      text: `Your current password is wrong: ${error.message}`,
                    });
                  }
                }
              });
            }
          });
        } else {
          Swal.showValidationMessage(
            `Password must have at least 8 charcters \n at least 1 special character \n at least 1 number \n at least capital characters`
          );
        }
      });
    },
  });
});
async function checkPasswordStrength(password) {
  const minLength = 8;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*]/.test(password);
  let strength = 0;
  if (password.length >= minLength) {
    strength++;
    if (hasLowercase) strength++;
    if (hasUppercase) strength++;
    if (hasNumber) strength++;
    if (hasSpecialChar) strength++;
  } else {
    strength = 0;
  }
  switch (strength) {
    case 5:
      return true;
    case 4:
      return false;
    case 3:
      return false;
    case 2:
      return false;
    default:
      return false;
  }
}
