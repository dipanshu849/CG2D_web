import "../styles/modern-normalize.css";
import "../styles/style.css";
import "../styles/utils.css";
import "../styles/components/header.css";
import "../styles/components/hero.css";

import mobileNav from "./components/mobile-nav.js";
mobileNav();

// window.scrollTo({ top: 0, behavior: "smooth" });

// lazy load
document.addEventListener("DOMContentLoaded", () => {
  import("../styles/components/hero-description.css");
  import("../styles/components/hero-downArrow.css");
  import("../styles/components/about-description.css");
  import("../styles/components/featured.css");
  import("../styles/components/team.css");
  import("../styles/utils/team__card.css");
  import("../styles/components/project.css");
  import("../styles/components/achievements.css");
  import("../styles/components/conclusion/conclusion.css");
  import("../styles/components/contact.css");
  import("../styles/components/mobile-nav.css");

  let progressPercentage = document.querySelector(
    ".loadingManager__percentage"
  );
  progressPercentage.textContent = "020";

  // Heavy components
  import("./three/three").then((module) => module.default());
  import("./components/imageSlider").then((module) => module.default());
  import("./components/oceanEffect").then((module) => module.default());

  // Utils
  import("./vanilla-tilt.js").catch(console.error);
  import("./components/lazy-loading.js").then((module) => module.default());
});

// directly used from [https://www.w3schools.com/jquery/jquery_syntax.asp]
$(document).ready(function () {
  // first scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });
  // Add smooth scrolling to all links
  $("a").on("click", function (event) {
    // Make sure this.hash has a value before overriding default behavior
    if (this.hash !== "") {
      // Prevent default anchor click behavior
      event.preventDefault();

      // Store hash
      var hash = this.hash;

      // Using jQuery's animate() method to add smooth page scroll
      // The optional number (800) specifies the number of milliseconds it takes to scroll to the specified area
      $("html, body").animate(
        {
          scrollTop: $(hash).offset().top,
        },
        800,
        function () {
          // Add hash (#) to URL when done scrolling (default click behavior)
          window.location.hash = hash;
        }
      );
    } // End if
  });
});
