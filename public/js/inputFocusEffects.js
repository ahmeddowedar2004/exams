export function inputsAnimation() {
  // Inputs Animation
  const inputs = document.querySelectorAll(".input");

  function focusFunc() {
    const parent = this.parentNode;
    parent.classList.add("focus");
  }

  function blurFunc() {
    const parent = this.parentNode;
    if (this.value === "") {
      parent.classList.remove("focus");
    }
  }

  inputs.forEach((input) => {
    // Add event listeners for focus and blur
    input.addEventListener("focus", focusFunc);
    input.addEventListener("blur", blurFunc);

    // Check if the input already has a value and apply animation
    if (input.value.trim() !== "") {
      const parent = input.parentNode;
      parent.classList.add("focus");
    }
  });
}
