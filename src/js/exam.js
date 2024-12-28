import { getLocStore, setLocStore, topRightSwal } from "./myFramework";
import { db, auth } from "../firebase.config";
import {
  getDocs,
  collection,
  getDoc,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import Swal from "sweetalert2";
import { onAuthStateChanged } from "firebase/auth";
import { checkAuth } from "./auth";
import { showLoading, hideLoading } from "./loadingAnimate";

showLoading(".loader1", "active");

checkAuth;

onAuthStateChanged(auth, (user) => {
  if (!user) {
    location.href = "/login";
  } else {
    setLocStore("uid", user.uid);
  }
});

const uid = getLocStore("uid");
!uid ? setLocStore("uid", auth.currentUser.uid) : "";

const prevBtn = document.querySelector(".prev-btn"),
  startBtn = document.querySelector(".start-btn"),
  popupInfo = document.querySelector(".popup-info"),
  exitBtn = document.querySelector(".exit-btn"),
  continueBtn = document.querySelector(".continue-btn"),
  quizBox = document.querySelector(".quiz-box"),
  quizSection = document.querySelector(".quiz-section"),
  nextBtn = document.querySelector(".next-btn"),
  tryAgainBtn = document.querySelector(".tryAgain-btn"),
  questionTotal = document.querySelector(".question-total"),
  optionList = document.querySelector(".option-list"),
  main = document.querySelector(".main"),
  homeBtn = document.querySelector(".home-btn"),
  showresultBtn = document.querySelector(".showresultBtn");

// timer
let timerInterval;
let remainingTime = 60 * 60;

function updateTimer() {
  if (remainingTime > 0) {
    remainingTime--;
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    let time = `الوقت المتبقي: ${minutes} : ${seconds} `;
    document.querySelector(".quiz-timer").innerHTML = time;
  } else {
    clearInterval(timerInterval);
    showResult();
  }
}
function startTimer() {
  setInterval(updateTimer, 1000);
}
function checkPrevBtn() {
  if (questionCount === 0) {
    prevBtn.classList.add("disabled");
    prevBtn.classList.remove("active");
  } else {
    prevBtn.classList.remove("disabled");
    prevBtn.classList.add("active");
  }
}

const questions = [];
let answers = [];
let questionCount = 0;
let score = 0;

let examId = location.pathname.split("/")[2];

if (getLocStore("examId") != examId) {
  setLocStore("examId", examId);
  answers = [];
  setLocStore("answers", JSON.stringify(answers));
} else {
  getLocStore("answers")
    ? (answers = JSON.parse(getLocStore("answers")))
    : (answers = []);
}

try {
  const exam = await getDoc(doc(db, "exams", examId));
  const examData = exam.data();
  if (examData.isApproved === false) {
    Swal.fire({
      title: "لم يتم الموافقة على الامتحان ",
      text: "عذراً لم يتم الموافقة على هذا الامتحان بعد لعرضه، يرجى التواصل مع مسؤل الموافقة او الرجوع للصفحة الرئيسيه",
      icon: "warning",
      confirmButtonText: "حسناً",
      allowOutsideClick: false,
      allowEscapeKey: false,
    }).then((res) => {
      if (res.isConfirmed) {
        location.href = "/";
      }
    });
  } else {
    examData.questions.forEach((question) => {
      questions.push(question);
      if (!getLocStore("answers")) {
        answers.push("");
      }
    });
    checkPrevBtn();
    startCheck;
  }
} catch (error) {
  console.error("Error getting document:", error);
} finally {
  hideLoading(".loader1", "active");
}

async function startCheck() {
  if (getLocStore("answers")) {
    if (answers.at(-1) != "") {
      await Swal.fire({
        title: "تم الانتهاء من الامتحان",
        text: "هل تريد إعادة بدء الامتحان؟",
        icon: "question",
        confirmButtonColor: "#3085d6",
        denyButtonColor: "#d33",
        confirmButtonText: "نعم",
        denyButtonText: "عرض النتيجة",
        showDenyButton: true,
      }).then((result) => {
        if (result.isConfirmed) {
          restartExam();
        }
        if (result.isDenied) {
          location.href = `/results/${getLocStore("uid")}/${examId}`;
        }
      });
    } else {
      Swal.fire({
        title: "استئناف الامتحان",
        text: "هل تريد استئناف الامتحان السابق؟",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "نعم",
        cancelButtonText: "لا",
      }).then(async (result) => {
        if (result.isConfirmed) {
          topRightSwal("تم استئناف الامتحان", "success");
          startExam();
        } else {
          restartExam();
        }
      });
    }
  }
}

function startExam() {
  const elapsedTime = Date.now() - JSON.parse(getLocStore("startTime"));
  remainingTime -= Math.floor(elapsedTime / 1000);
  startTimer();

  setLocStore("startTime", JSON.stringify(Date.now()));
  remainingTime = 60 * 60; // Reset timer
  startTimer();

  // Restore last question index
  const lastAnsweredIndex = answers.findIndex((answer) => answer === "");

  questionCount =
    lastAnsweredIndex !== -1 ? lastAnsweredIndex : answers.length - 1;
  console.log("question count", questionCount);
  quizSection.classList.add("active");
  quizBox.classList.add("active");
  popupInfo.classList.remove("active");
  main.classList.remove("active");

  // Show the restored question based on questionCount
  showQuestion(questionCount);
  questionTotal.innerHTML = `${questionCount + 1} / ${questions.length}`;
  startTimer();
  checkPrevBtn();
}

function restartExam() {
  answers = [];
  questions.forEach(() => {
    answers.push("");
  });
  setLocStore("answers", JSON.stringify(answers));
  questionCount = 0; // Reset question index
  startExam(0);
  checkPrevBtn();
  if (document.querySelector(".result-box").classList.contains("active")) {
    document.querySelector(".result-box").classList.remove("active");
  }
  topRightSwal("تم إعادة بدء الامتحان", "success");
}

prevBtn.addEventListener("click", () => {
  if (questionCount > 0) {
    questionCount--;
    showQuestion(questionCount);
    questionTotal.innerHTML = `${questionCount + 1} / ${questions.length}`;
  }
  checkPrevBtn();
});

startBtn.addEventListener("click", () => {
  popupInfo.classList.add("active");
  main.classList.add("active");
});

exitBtn.addEventListener("click", () => {
  popupInfo.classList.remove("active");
  main.classList.remove("active");
});

continueBtn.addEventListener("click", () => {
  setLocStore("startTime", JSON.stringify(Date.now()));
  quizSection.classList.add("active");
  quizBox.classList.add("active");
  popupInfo.classList.remove("active");
  main.classList.remove("active");
  showQuestion(0);
  questionTotal.innerHTML = `1 / ${questions.length}`;
  startTimer();
});

nextBtn.addEventListener("click", () => {
  if (nextBtn.classList.contains("active")) {
    if (questionCount !== questions.length - 1) {
      questionCount++;
      showQuestion(questionCount);
      questionTotal.innerHTML = `${questionCount + 1} / ${questions.length}`;
      checkPrevBtn();
    } else {
      showResult();
      checkPrevBtn();
    }
  }
});
let questionIndex = 1;
// Updated showQuestion to reflect questionCount accurately
function showQuestion(index) {
  const questionText = document.querySelector(".question-text");
  questionText.textContent = `${index + 1}. ${questions[index].questionText}`;

  let optionTag = "";
  if (questions[index].options.length <= 2) {
    optionTag = `<div class="option" data-value="true"><span>✅</span></div>
      <div class="option" data-value="false"><span>❌</span></div>`;
  } else {
    optionTag = questions[index].options
      .map(
        (option) =>
          `<div class="option" data-value="${option}"><span>${option}</span></div>`
      )
      .join("");
  }
  optionList.innerHTML = optionTag;

  const options = document.querySelectorAll(".option");
  options.forEach((option, i) => {
    if (answers[index] === option.getAttribute("data-value")) {
      console.log(option, answers[index]);
      option.classList.add("selected");
    } else {
      console.log(answers[index]);
    }
    option.addEventListener("click", () => {
      optionSelected(option);
    });
  });

  // Update Next/Previous button states
  nextBtn.classList.toggle("active", !!answers[index]);
  prevBtn.classList.toggle("disabled", questionCount === 0);
}

function optionSelected(answer) {
  console.log(answer);
  let userAnswer = answer.getAttribute("data-value");
  answers[questionCount] = userAnswer;
  setLocStore("answers", JSON.stringify(answers));

  document.querySelectorAll(".option").forEach((option) => {
    option.classList.remove("selected");
  });
  answer.classList.add("selected");
  nextBtn.classList.add("active");
}

async function showResult() {
  showLoading(".loader1", "active");

  quizSection.classList.add("active");
  quizBox.classList.add("active");
  popupInfo.classList.remove("active");
  main.classList.remove("active");
  document.querySelector(".result-box").classList.add("active");
  quizBox.classList.remove("active");
  const circleProgress = document.querySelector(".circular-progress");
  const progressValue = document.querySelector(".progress-value");

  answers.forEach((answer, i) => {
    if (answer === questions[i].correctAnswer) {
      score++;
    }
  });

  let progressStartValue = 0;
  if (score === 0) {
    var progressEndValue = 1;
  } else {
    var progressEndValue = Math.trunc((score / questions.length) * 100);
  }

  document.querySelector(
    ".score-text"
  ).textContent = `نتيجتك هي ${score} من ${questions.length}`;

  let speed = 20;
  let progress = setInterval(() => {
    progressStartValue++;
    progressValue.textContent = `${progressStartValue}%`;
    circleProgress.style.background = `conic-gradient(#c40094 ${
      progressStartValue * 3.6
    }deg, rgba(255, 255, 255, 0.1) 0deg)`;
    if (progressStartValue == progressEndValue) {
      clearInterval(progress);
    }
  }, speed);

  try {
    // Save user result to a subcollection
    const userResultsCollectionRef = collection(db, "results", uid, examId);

    await addDoc(userResultsCollectionRef, {
      uid: uid,
      examId: examId,
      score: score,
      answers: answers,
      solvedAt: new Date().toISOString(),
      questions: questions,
    }).then(async (docu) => {
      await updateDoc(doc(db, "users", uid), {
        solvedExams: arrayUnion(docu.id),
      });
    });

    console.log("Result saved successfully!");
  } catch (error) {
    console.error("Error saving result:", error);

    Swal.fire({
      title: "حدث خطأ ما",
      icon: "error",
      text: `حدث خطأ أثناء حفظ النتيجة. ${error.message}`,
      confirmButtonText: "حاول مرة أخرى",
    }).then(() => showResult());
  } finally {
    hideLoading(".loader1", "active");
  }
}

function retry() {
  showQuestion(0);
  restartExam();
  score = 0;
}

tryAgainBtn.addEventListener("click", () => {
  retry();
  startTimer();
});

homeBtn.addEventListener("click", () => {
  location.href = "/";
});
showresultBtn.addEventListener("click", () => {
  location.href = `/results/${uid}/${examId}`;
});
