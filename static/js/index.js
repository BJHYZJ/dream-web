/* Shared, progressively enhanced controls for the research pages. */
(() => {
  "use strict";

  const videos = [...document.querySelectorAll("video")];
  videos.forEach((video) => {
    video.addEventListener("play", () => {
      videos.forEach((other) => {
        if (other !== video) other.pause();
      });
    });
    const frame = video.closest(".video-frame");
    if (!frame || !video.poster) return;
    const play = document.createElement("button");
    play.type = "button";
    play.className = "video-play";
    play.textContent = "▶";
    play.setAttribute(
      "aria-label",
      `Play: ${video.getAttribute("aria-label") || "task recording"}`,
    );
    play.addEventListener("click", async () => {
      video.controls = true;
      try {
        await video.play();
        play.hidden = true;
      } catch {
        // Keep the native controls available if playback is not supported.
        play.hidden = true;
      }
    });
    video.addEventListener("play", () => {
      play.hidden = true;
    });
    frame.append(play);
  });

  document.querySelectorAll("[data-copy-target]").forEach((button) => {
    button.addEventListener("click", async () => {
      const source = document.getElementById(button.dataset.copyTarget);
      const status = document.getElementById("copy-status");
      if (!source) return;
      try {
        await navigator.clipboard.writeText(source.textContent.trim());
        button.textContent = "Copied";
        if (status) status.textContent = "Citation copied to clipboard.";
        window.setTimeout(() => {
          button.textContent = "Copy citation";
        }, 2200);
      } catch {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(source);
        selection.removeAllRanges();
        selection.addRange(range);
        if (status)
          status.textContent =
            "Citation selected. Use your browser’s copy command.";
        button.textContent = "Citation selected";
      }
    });
  });

  function revealAnchor() {
    if (!window.location.hash) return;
    let identifier;
    try {
      identifier = decodeURIComponent(window.location.hash.slice(1));
    } catch {
      return;
    }
    const target = document.getElementById(identifier);
    if (!target) return;
    let parent = target;
    while (parent) {
      if (parent.tagName === "DETAILS") parent.open = true;
      parent = parent.parentElement;
    }
  }
  window.addEventListener("hashchange", revealAnchor);
  revealAnchor();
})();
