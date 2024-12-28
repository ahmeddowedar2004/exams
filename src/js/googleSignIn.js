import { db, auth } from "../firebase.config.js";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { topRightSwal, getLocStore, setLocStore } from "./myFramework";
export async function loginWithGoogle() {
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
  try {
    const provider = new GoogleAuthProvider();
    auth.useDeviceLanguage();
    signInWithPopup(auth, provider).then(async (result) => {
      const country = (await getUserLocation()).country;
      const governorate = (await getUserLocation()).goverorate;
      const user = result.user;
      try {
        const uid = user.uid;
        setLocStore("uid", uid);
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          topRightSwal(`Logged in successfully`);
          setTimeout(() => {
            location.replace("/profile");
          }, 1500);
        } else {
          let phoneNumber;
          if (user.phoneNumber != null || user.phoneNumber != undefined) {
            phoneNumber = user.phoneNumber;
          } else {
            phoneNumber = "0";
          }
          const userData = {
            name: user.displayName,
            photo: user.photoURL,
            phoneNumber: phoneNumber || "0",
            email: user.email,
            uid: user.uid,
            loginMethod: "Google",
            createdAt: new Date(),
            governorate: governorate,
            gender: "none",
          };
          await setDoc(doc(db, "users", user.uid), userData)
            .then(() => {
              topRightSwal("Registered successfully");
            })
            .then(
              setTimeout(() => {
                location.replace("/profile");
              }, 1500)
            )
            .catch((error) => {
              const errorCode = error.code;
              const errorMessage = error.message;
              topRightSwal(
                `Error while signing in with Google \n error code: ${errorCode} \n error message: ${errorMessage}`,
                "error"
              );
            });
        }
      } catch (error) {
        topRightSwal(`Something went wrong ${error}`, "error");
      }
    });
  } catch (error) {
    topRightSwal(`Error while signing in with google: ${error}`, "error");
  }
}
