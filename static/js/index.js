document.querySelectorAll(".copy-button").forEach((button) => {
  button.addEventListener("click", async () => {
    const target = document.getElementById(button.dataset.copyTarget);
    const label = button.querySelector(".copy-button-text");

    if (!target || !label) {
      return;
    }

    try {
      await navigator.clipboard.writeText(target.textContent.trim());
      label.textContent = "Copied";
      button.classList.add("is-copied");

      window.setTimeout(() => {
        label.textContent = "Copy";
        button.classList.remove("is-copied");
      }, 1800);
    } catch (error) {
      label.textContent = "Failed";

      window.setTimeout(() => {
        label.textContent = "Copy";
      }, 1800);
    }
  });
});
