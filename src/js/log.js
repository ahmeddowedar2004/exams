import { auth, db } from "../firebase.config";
import { signInWithEmailAndPassword } from "firebase/auth";
document.getElementById("signBtn").addEventListener("click", async () => {
  await signInWithEmailAndPassword(
    auth,
    document.getElementById("email").value,
    document.getElementById("password").value
  )
    .then(() => location.replace("/"))
    .catch((err) => alert(`err: ${err}`));
});
