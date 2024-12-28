export async function showLoading(item, className) {
  let itemToLoad = document.querySelector(item);
  itemToLoad.classList.add(className);
  document.querySelector(".loaderContainer").classList.add("active");
}
export async function hideLoading(item, className) {
  let itemToLoad = document.querySelector(item);
  itemToLoad.classList.remove(className);
  document.querySelector(".loaderContainer").classList.remove("active");
}
