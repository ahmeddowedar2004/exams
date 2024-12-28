import { auth } from "../firebase.config.js";
import { topRightSwal } from "./myFramework";
import { signOut } from "firebase/auth";
export async function logoutUser() {
  try {
    await signOut(auth).then(() => {
      localStorage.clear();
      sessionStorage.clear();
      location.href = "/login";
    });
  } catch (error) {
    topRightSwal(`Error while logging out: ${error}`, "error");
  }
}
