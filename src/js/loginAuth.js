import { db, auth } from "../firebase.config.js";
import { onAuthStateChanged } from "firebase/auth";

function checkEmailVerification() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      await user.reload();
      if (user.emailVerified) {
        location.replace("/");
      } else {
        location.replace("/activate-account");
      }
    }
  });
}

checkEmailVerification();
