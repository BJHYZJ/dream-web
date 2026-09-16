/* Preserve the project's existing analytics on the published homepage. */
(() => {
  "use strict";
  if (window.location.hostname !== "bjhyzj.github.io") return;
  const measurement = "G-EW90Q0TP2T";
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurement);
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurement}`;
  document.head.append(script);
})();
