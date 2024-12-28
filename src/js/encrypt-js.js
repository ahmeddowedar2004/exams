import CryptoJS from "crypto-js";
const secretKey = "MZ-exam-@#-library";
export function encryptData(data) {
  return CryptoJS.AES.encrypt(data, secretKey).toString();
}
export function decryptData(encryptedData) {
  const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}
