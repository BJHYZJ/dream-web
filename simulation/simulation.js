/* Gallery filters and stable links into recorded task sequences. */
(() => {
  "use strict";
  const cards = [...document.querySelectorAll("[data-attempt]")];
  const scene = document.getElementById("scene-filter");
  const search = document.getElementById("search-filter");
  const buttons = [...document.querySelectorAll("[data-outcome-filter]")];
  let outcome = "all";

  function applyFilters() {
    if (!scene || !search) return;
    const query = search.value.trim().toLowerCase();
    let visible = 0;
    cards.forEach((card) => {
      const show =
        (outcome === "all" || card.dataset.outcome === outcome) &&
        (scene.value === "all" || card.dataset.scene === scene.value) &&
        (!query || card.dataset.search.toLowerCase().includes(query));
      card.hidden = !show;
      if (show) visible += 1;
      else card.querySelector("video")?.pause();
    });
    buttons.forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.outcomeFilter === outcome),
      );
    });
    document.getElementById("gallery-count").textContent =
      `${visible} of ${cards.length} task recordings`;
    document.getElementById("gallery-empty").hidden = visible !== 0;
  }

  function resetFilters() {
    outcome = "all";
    scene.value = "all";
    search.value = "";
    applyFilters();
  }

  if (cards.length && scene && search) {
    buttons.forEach((button) =>
      button.addEventListener("click", () => {
        outcome = button.dataset.outcomeFilter;
        applyFilters();
      }),
    );
    scene.addEventListener("change", applyFilters);
    search.addEventListener("input", applyFilters);
    document
      .getElementById("reset-filters")
      .addEventListener("click", resetFilters);
    document.getElementById("gallery-toolbar").hidden = false;
    applyFilters();
  }

  function revealRun() {
    const card = cards.find((item) => `#${item.id}` === window.location.hash);
    if (!card) return;
    resetFilters();
    card.scrollIntoView({ block: "start" });
  }
  window.addEventListener("hashchange", revealRun);
  document
    .querySelectorAll(".outcome-table a")
    .forEach((link) => link.addEventListener("click", resetFilters));
  revealRun();

  // A figure in the paper can link to a particular time without autoplaying it.
  const query = new URLSearchParams(window.location.search);
  const caseId = query.get("video");
  const seconds = Number(query.get("t"));
  if (
    caseId &&
    /^(0[1-9]|[1-4][0-9]|50)$/.test(caseId) &&
    query.has("t") &&
    Number.isFinite(seconds) &&
    seconds >= 0
  ) {
    const target = document.querySelector(`#trial-${caseId} video`);
    if (target) {
      target.preload = "metadata";
      const seek = () => {
        target.currentTime = Math.min(
          seconds,
          Number.isFinite(target.duration) ? target.duration : seconds,
        );
      };
      if (target.readyState >= 1) seek();
      else target.addEventListener("loadedmetadata", seek, { once: true });
    }
  }
})();
