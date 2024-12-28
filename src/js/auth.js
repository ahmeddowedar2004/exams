import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase.config";
import { doc, getDoc } from "firebase/firestore";
import Swal from "sweetalert2";
console.log("Auth JS");
export const checkAuth = onAuthStateChanged(auth, async (user) => {
  if (user) {
    fetch("/set-cookie", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uid: user.uid }),
    });

    const userDoc = await getDoc(doc(db, "users", user.uid));
    !userDoc.data().approved
      ? Swal.fire({
          icon: "warning",
          title: "لم تتم الموافقة بعد",
          html: `عذراً لم تتم الموافقه على حسابك بعد، يرجى الانتظار حتى تتم عملية الموافقة من قبل المسؤل
        للتواصل مع مسؤل الموافقة: <br>
        <a href="https://wa.me/+201068165899" class="btnLink">منة تامر</a> `,
          allowEscapeKey: false,
          allowOutsideClick: false,
          showCloseButton: false,
          showCancelButton: false,
          showConfirmButton: false,
          showDenyButton: false,
          allowEnterKey: false,
        })
      : "";
  } else {
    fetch("/clear-cookie", { method: "POST" });

    Swal.fire({
      title: "لم يتم تسجيل الدخول",
      icon: "error",
      text: "يجب تسجيل الدخول للوصول لهذه الصفحة",
      confirmButtonText: "تسجيل الدخول",
      showCancelButton: false,
      showCloseButton: false,
      showConfirmButton: true,
      allowEscapeKey: false,
      allowOutsideClick: false,
      allowEnterKey: false,
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = "/login";
      }
    });
  }
});
