import { inputsAnimation } from "./inputFocusEffects.js";
import { db, auth } from "../firebase.config.js";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { $, setLocStore, topRightSwal } from "./myFramework.js";
import { decryptData, encryptData } from "./encrypt-js.js";
async function checkAuth() {
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
await checkAuth();

async function getUserLocation() {
  try {
    const response = await fetch("https://ipwhois.app/json/");
    const data = await response.json();

    const country = data.country;
    const goverorate = data.country_capital; // Assuming this is the governorate (city)
    return { country, goverorate };
  } catch (error) {
    console.error("Error fetching location data:", error);
  }
}

fetchCitiesForCountry();

async function fetchCitiesForCountry() {
  const cityContainer = document.getElementById("city");

  try {
    const response = await fetch(
      "https://countriesnow.space/api/v0.1/countries/cities",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: "Egypt" }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const cities = result.data; // Verify API structure
    // Clear existing options
    cityContainer.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select a city";
    cityContainer.appendChild(defaultOption);

    // Populate with new cities
    cities.forEach((city) => {
      const option = document.createElement("option");
      option.value = city;
      option.textContent = city;
      cityContainer.appendChild(option);
    });

    // Set the current governorate if available
    const currentLocation = await getUserLocation();
    if (
      currentLocation.goverorate &&
      cities.includes(currentLocation.goverorate)
    ) {
      cityContainer.value = currentLocation.goverorate;
    }
  } catch (error) {
    console.error("Error fetching city data:", error);
    // Optional: Handle UI fallback for errors
    cityContainer.innerHTML = "";
    const errorOption = document.createElement("option");
    errorOption.value = "";
    errorOption.textContent = "Error loading cities";
    cityContainer.appendChild(errorOption);
  }
}
const governorate = (await getUserLocation()).goverorate;

document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
});

async function signUpUser(userData) {
  try {
    const email = decryptData(userData.email);
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      userData.password
    );
    const user = userCredential.user;
    await updateProfile(user, { displayName: userData.name });
    const neededData = {
      name: userData.name,
      email: userData.email,
      phoneNumber: userData.phonNumber,
      uid: user.uid,
      loginMethod: "Email",
      createdAt: new Date(),
      governorate: userData.governorate || governorate || "null",
      gender: userData.gender,
      role: "student",
      approved: false,
      solvedExams: [],
      createdExams: [],
      qesm: userData.qesm,
      uniId: userData.uniId,
      ferqa: userData.ferqa,
    };
    setLocStore("uid", user.uid);

    document.cookie = `uid=${user.uid}; path=/; secure`;

    await setDoc(doc(db, "users", user.uid), neededData);
    await topRightSwal("تم انشاء الحساب بنجاح");

    return user;
  } catch (error) {
    topRightSwal(
      `حدث خطا أثناء انشاء الحساب
       ${error}`,
      "error"
    );

    throw error;
  }
}

inputsAnimation();
document.querySelectorAll(".eye_icon").forEach((eye) => {
  eye.addEventListener("click", () => {
    const parent = eye.parentElement;
    const input = parent.querySelector("input");
    if (input.type === "password") {
      input.type = "text";
      eye.nextElementSibling.classList.toggle("!hidden");
      eye.classList.toggle("!hidden");
    } else {
      input.type = "password";
      eye.previousElementSibling.classList.toggle("!hidden");
      eye.classList.toggle("!hidden");
    }
  });
});

const passwordField = $("#password");
const passInfo = document.getElementById("passInfo");
const passConfirmInfo = document.getElementById("passConfirm");
passwordField.on("focus", () => {
  checkPasswordStrength($("#password").val().value);
});
passwordField.on("blur", () => {
  checkPasswordStrength($("#password").val().value);
});
$("#confirmPassword").on("focus", () => {
  passConfirm($("#confirmPassword").val().value);
});
$("#confirmPassword").on("blur", () => {
  passConfirm($("#confirmPassword").val().value);
});
$("#password").on("keyup", () => {
  checkPasswordStrength($("#password").val().value).then((res) => {
    if (res) {
      removeErrInputValueColor($("#password"));
    }
  });
});
$("#confirmPassword").on("keyup", async () => {
  passConfirm($("#confirmPassword").val().value).then((res) => {
    if (res) {
      removeErrInputValueColor($("#confirmPassword"));
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
$("#name").on("keyup", () => {
  $("#name").val().length >= 4 ? removeErrInputValueColor($("#name")) : null;
  validateName($("#name").val().value)
    ? removeErrInputValueColor($("#name"))
    : null;
});
$("#phoneNumber").on("keyup", () => {
  $("#phoneNumber").val().length >= 8
    ? removeErrInputValueColor($("#phoneNumber"))
    : null;
});

const signupForm = $("#signUpForm");
signupForm.on("submit", async (e) => {
  e.preventDefault();
  loadingBtnActive();
  if ($("#name").val().length >= 4) {
    validateName($("#name").val().value).then((res) => {
      if (res) {
        validateNum($("#phoneNumber").val()).then((res) => {
          if (res) {
            checkEmail($("#email1").val().value).then((res) => {
              if (res) {
                checkPasswordStrength($("#password").val().value).then(
                  (res) => {
                    if (res) {
                      passConfirm($("#confirmPassword").val().value).then(
                        (res) => {
                          if (res) {
                            genderConfirm(
                              document.querySelector('[name="gender"]:checked')
                            ).then((res) => {
                              if (res) {
                                uniIdConfirm($("#uniId").val()).then((res) => {
                                  if (res) {
                                    ferqaConfirm($("#ferqa").val().value).then(
                                      (res) => {
                                        if (res) {
                                          qesmConfirm(
                                            $("#qesm").val().value
                                          ).then((res) => {
                                            if (res) {
                                              const userData = {
                                                email: encryptData(
                                                  $("#email1").val().value
                                                ),
                                                password:
                                                  $("#password").val().value,
                                                name: encryptData(
                                                  $("#name").val().value
                                                ),
                                                phonNumber: encryptData(
                                                  $("#phoneNumber").val().value
                                                ),
                                                qesm: encryptData(
                                                  $("#elqesm").val().value
                                                ),
                                                ferqa: encryptData(
                                                  $("#user-group").val().value
                                                ),
                                                uniId: encryptData(
                                                  $("#uniId").val().value
                                                ),
                                                gender: encryptData(
                                                  document.querySelector(
                                                    '[name="gender"]:checked'
                                                  ).value
                                                ),
                                                governorate: encryptData(
                                                  $("#city").val().value
                                                ),
                                              };
                                              loadingBtnActive();
                                              signUpUser(userData).then(() => {
                                                setTimeout(() => {
                                                  location.replace("/");
                                                }, 1000);
                                              });
                                            } else {
                                              topRightSwal(
                                                "يرجى إختيار القسم",
                                                "error"
                                              );
                                              $("#qesm").focus();
                                              addErrInputValueColor($("#qesm"));
                                              loadingBtnDisable();
                                            }
                                          });
                                        } else {
                                          topRightSwal(
                                            "يرجى اختيار الفرقة",
                                            "error"
                                          );
                                          $("#ferqa").focus();
                                          addErrInputValueColor($("#ferqa"));
                                          loadingBtnDisable();
                                        }
                                      }
                                    );
                                  } else {
                                    topRightSwal(
                                      "يرجى ادخال رقم الـid الخاص بالكارنية الجامعي الخاص بك",
                                      "error"
                                    );
                                    $("#uniId").focus();
                                    addErrInputValueColor($("#uniId"));
                                    loadingBtnDisable();
                                  }
                                });
                              } else {
                                topRightSwal("يرجى تحديد الجنس", "error");
                                loadingBtnDisable();
                              }
                            });
                          } else {
                            topRightSwal(
                              "عذراً كلمتا المرور غير متطابقتان!",
                              "error"
                            );
                            $("#confirmPassword").focus();
                            addErrInputValueColor($("#confirmPassword"));
                            loadingBtnDisable();
                          }
                        }
                      );
                    } else {
                      topRightSwal("يرجى كتابة كلمة مرور أقوى", "error");
                      $("#password").focus();
                      addErrInputValueColor($("#password"));
                      loadingBtnDisable();
                    }
                  }
                );
              } else {
                topRightSwal("يرجى ادخال ايميل صالح", "error");
                $("#email1").focus();
                addErrInputValueColor($("#email1"));
                loadingBtnDisable();
              }
            });
          } else {
            topRightSwal("يرجى ادخال رقم هاتف صالح", "error");
            $("#phoneNumber").focus();
            addErrInputValueColor($("#phoneNumber"));
            loadingBtnDisable();
          }
        });
      } else {
        topRightSwal("يجب كتابة اسمك ثلاثياً", "error");
        $("#name").focus();
        addErrInputValueColor($("#name"));
        loadingBtnDisable();
      }
    });
  } else {
    topRightSwal("يجب ان لا يقل الاسم عن 4 حروف", "error");
    $("#name").focus();
    addErrInputValueColor($("#name"));
    loadingBtnDisable();
  }
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
    document.getElementById("minLength").style.color = "green";
  } else {
    strength = 0;
    document.getElementById("minLength").style.color = "red";
  }
  hasLowercase ? strength++ : strength--;
  if (hasUppercase) {
    strength++;
    document.getElementById("capitalChar").style.color = "green";
  } else {
    strength--;
    document.getElementById("capitalChar").style.color = "red";
  }
  if (hasNumber) {
    strength++;
    document.getElementById("haveNum").style.color = "green";
  } else {
    document.getElementById("haveNum").style.color = "red";
    strength--;
  }
  if (hasSpecialChar) {
    strength++;
    document.getElementById("specialChar").style.color = "green";
  } else {
    strength--;
    document.getElementById("specialChar").style.color = "red";
  }
  switch (strength) {
    case 5:
      hidePassStrength();
      return true;
    case 4:
      showPassStrength();
      return false;
    case 3:
      showPassStrength();
      return false;
    case 2:
      showPassStrength();
      return false;
    default:
      showPassStrength();
      return false;
  }
}
async function genderConfirm(gender) {
  if (gender != null) {
    return true;
  } else {
    return false;
  }
}
async function uniIdConfirm(id) {
  if (id.length >= 8) {
    return true;
  } else {
    return false;
  }
}
async function ferqaConfirm(ferqa) {
  if (ferqa != null || ferqa != "") {
    return true;
  } else {
    return false;
  }
}
async function qesmConfirm(qesm) {
  if (qesm != null || qesm != "") {
    return true;
  } else {
    return false;
  }
}
async function passConfirm(confirmPassword) {
  const passValue = $("#password").val().value;
  if (passValue == confirmPassword) {
    hidePassConfirm();
    return true;
  } else {
    showPassConfirm();
    return false;
  }
}
async function checkEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (emailRegex.test(email)) {
    return true;
  } else {
    return false;
  }
}
async function validateNum(number) {
  if (number.length >= 10 && number.length <= 11) {
    return true;
  } else {
    return false;
  }
}
async function validateName(name) {
  const regex = /^(\S+\s+){2,}\S+$/; // At least three words with spaces in between
  if (regex.test(name.trim())) {
    return true;
  } else {
    return false;
  }
}
function showPassStrength() {
  passInfo.style.maxHeight = "120px";
  passInfo.style.opacity = "1";
  passInfo.style.padding = "8px";
  passInfo.style.marginBottom = "12px";
}
function hidePassStrength() {
  passInfo.style.maxHeight = "0";
  passInfo.style.opacity = "0";
  passInfo.style.padding = "0";
  passInfo.style.marginBottom = "0";
}
function showPassConfirm() {
  passConfirmInfo.style.maxHeight = "40px";
  passConfirmInfo.style.opacity = "1";
  passConfirmInfo.style.padding = "8px";
  passConfirmInfo.style.marginBottom = "12px";
}
function hidePassConfirm() {
  passConfirmInfo.style.maxHeight = "0";
  passConfirmInfo.style.opacity = "0";
  passConfirmInfo.style.padding = "0";
  passConfirmInfo.style.marginBottom = "0";
}

function addErrInputValueColor(input) {
  input.removeClass("text-black", "border-black");
  input.addClass("text-red-600", "border-red-600");
}
function removeErrInputValueColor(input) {
  input.removeClass("text-red-600", "border-red-600");
  input.addClass("text-black", "border-black");
}

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
