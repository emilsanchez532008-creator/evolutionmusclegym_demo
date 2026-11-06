(function () {
  "use strict";

  var heroImage = document.querySelector(".hero-media img");
  if (!heroImage) return;

  heroImage.addEventListener("error", function () {
    var media = heroImage.closest(".hero-media");
    if (!media) return;

    media.classList.add("media-fallback");
    heroImage.hidden = true;
  });
})();
