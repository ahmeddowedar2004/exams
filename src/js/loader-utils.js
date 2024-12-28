/**
 * Show a loading spinner on a target element.
 * @param {string | HTMLElement} item - CSS selector or DOM element to attach the loader.
 * @param {string} customClass - Optional custom class for the loader (default: "loading").
 * @param {object} customStyle - Optional inline styles for the loader.
 */
export function showLoading(item, customClass = "loading", customStyle = {}) {
  // If item is a selector, find the corresponding DOM element
  if (typeof item === "string") {
    item = document.querySelector(item);
  }

  if (!item) {
    console.error("Target element not found for showLoading.");
    return;
  }

  // Ensure the parent element has a position context
  const originalPosition = item.style.position;
  if (!["relative", "absolute", "fixed"].includes(originalPosition)) {
    item.style.position = "relative";
  }

  // Create the loader element
  const loader = document.createElement("div");
  loader.className = customClass;
  loader.dataset.loader = "true"; // Use a data attribute for easier targeting

  // Apply inline styles for centering
  Object.assign(loader.style, {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: customStyle.width || "24px",
    height: customStyle.height || "24px",
    zIndex: "999", // Ensure the loader is on top
    ...customStyle,
  });

  // Add the loader to the target element
  item.appendChild(loader);
}

/**
 * Hide a loading spinner from a target element.
 * @param {string | HTMLElement} item - CSS selector or DOM element to remove the loader from.
 */
export function hideLoading(item) {
  // If item is a selector, find the corresponding DOM element
  if (typeof item === "string") {
    item = document.querySelector(item);
  }

  if (!item) {
    console.error("Target element not found for hideLoading.");
    return;
  }

  // Find and remove the loader
  const loader = item.querySelector("[data-loader='true']");
  if (loader) {
    item.removeChild(loader);
  }
}

/* HTML: <div class="loader1"></div> */
// .loader1 {
//     width: 50px;
//     aspect-ratio: 1;
//     border-radius: 50%;
//     background:
//       radial-gradient(farthest-side,#ffa516 94%,#0000) top/8px 8px no-repeat,
//       conic-gradient(#0000 30%,#ffa516);
//     -webkit-mask: radial-gradient(farthest-side,#0000 calc(100% - 8px),#000 0);
//     animation: l13 1s infinite linear;
//   }
//
