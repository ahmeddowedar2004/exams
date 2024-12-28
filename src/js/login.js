import { inputsAnimation } from "./inputFocusEffects.js";
import { db, auth } from "../firebase.config.js";
import { signInWithEmailAndPassword } from "firebase/auth";
import { $, setLocStore, getLocStore, topRightSwal } from "./myFramework.js";
import { setDoc, doc, getDoc } from "firebase/firestore";
import Swal from "sweetalert2";
function checkAuth() {
  auth.onAuthStateChanged((user) => {
    if (user) {
      // Send UID to the backend
      fetch("/set-cookie", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uid: user.uid }),
      });
    } else {
      // Clear the cookie if no user is logged in
      fetch("/clear-cookie", { method: "POST" });
    }
  });
}
checkAuth();
async function loginUser(credentials) {
  try {
    await signInWithEmailAndPassword(
      auth,
      credentials.email,
      credentials.pass
    ).then(async (res) => {
      const uid = res.user.uid;
      setLocStore("uid", uid);
      try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTimeout(() => {
            location.replace("/");
          }, 1500);
        } else {
          Swal.fire({
            title: "Something happen, please contact admin",
            icon: "error",
            confirmButtonText: "Ok",
          }).then((res) => {
            if (res.isConfirmed) {
              location.replace("https://wa.me/+201005095412");
            }
          });
        }
      } catch (error) {
        try {
          setDoc(
            doc(db, "users", uid),
            {
              email: credentials.email,
              uid: uid,
              error: `Error while Getting user document while logging in \n${error}`,
            },
            { merge: true }
          ).then(() => {
            setTimeout(() => {
              location.replace("/");
            }, 1500);
          });
        } catch (error) {
          topRightSwal(
            `There was a problem while signing in, please contact support ${error}\n use this for your uid required: ${uid}`,
            "error"
          );
        }
      }
      topRightSwal("Signed in successfully");
    });
  } catch (error) {
    topRightSwal(`Error on email or password`, "error");
  }
}
inputsAnimation();

$("#loginForm").on("submit", async (e) => {
  loadingBtnActive();
  e.preventDefault();
  const signInInfo = {
    email: $("#email1").val().value,
    pass: $("#password").val(),
  };
  await checkEmail(signInInfo.email).then(async (res) => {
    if (res) {
      await checkPasswordStrength(signInInfo.pass).then((result) => {
        const pass = signInInfo.pass.value;
        const email = signInInfo.email;

        if (result) {
          loginUser({ email, pass })
            .catch((err) => {
              throw new Error("Error", err);
            })
            .finally(loadingBtnDisable);
        } else {
          topRightSwal("Please enter a valid password", "error");
          $("#password").focus();
          addErrInputValueColor($("#password"));
          loadingBtnDisable();
        }
      });
    } else {
      topRightSwal("Please enter a valid email", "error");
      $("#email1").focus();
      addErrInputValueColor($("#email1"));
      loadingBtnDisable();
    }
  });
});

async function checkEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const isValidEmail = emailRegex.test(email);
  if (isValidEmail) {
    return true;
  } else {
    return false;
  }
}

async function checkPasswordStrength(password) {
  const minLength = 8;
  const hasLowercase = /[a-z]/.test(password.value);
  const hasUppercase = /[A-Z]/.test(password.value);
  const hasNumber = /\d/.test(password.value);
  const hasSpecialChar = /[!@#$%^&*]/.test(password.value);
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

$(".eye_icon").on("click", () => {
  const passwordInput = document.getElementById("password");
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    $("#hidePassword").toggleClass("forceHidden");
    $("#showPassword").toggleClass("forceHidden");
  } else {
    passwordInput.type = "password";
    $("#hidePassword").toggleClass("forceHidden");
    $("#showPassword").toggleClass("forceHidden");
  }
});

function addErrInputValueColor(input) {
  input.removeClass("text-black", "border-black");
  input.addClass("text-red-600", "border-red-600");
}
function removeErrInputValueColor(input) {
  input.removeClass("text-red-600", "border-red-600");
  input.addClass("text-black", "border-black");
}
$("#password").on("keyup", () => {
  checkPasswordStrength($("#password").val()).then((res) => {
    if (res) {
      removeErrInputValueColor($("#password"));
    }
  });
});
$("#email1").on("keyup", () => {
  checkEmail($("#email1").val().value).then((res) => {
    if (res) {
      removeErrInputValueColor($("#email1"));
    }
  });
});
function loadingBtnActive() {
  document.querySelector("#submitButton .btnWord").classList.add("hidden");
  document.querySelector("#submitButton .loaderBtn").classList.add("active");
  document.querySelector("#submitButton").classList.remove("bg-black");
  document.querySelector("#submitButton").classList.add("bg-slate-500");
}
function loadingBtnDisable() {
  document.querySelector("#submitButton .btnWord").classList.remove("hidden");
  document.querySelector("#submitButton .loaderBtn").classList.remove("active");
  document.querySelector("#submitButton").classList.add("bg-black");
  document.querySelector("#submitButton").classList.remove("bg-slate-500");
}
