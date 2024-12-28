import { auth } from "../firebase.config.js";

export function checkUser() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      location.replace("/login");
    }
  });
}
