// import "../styles/modern-normalize.css";
// import "../styles/style.css";
// // import "../styles/components/loading-manager.css";
// import "../styles/components/header.css";
// import "../styles/components/hero.css";
// import "../styles/components/hero-description.css";
// import "../styles/components/hero-downArrow.css";
// import "../styles/components/about-description.css";
// import "../styles/components/featured.css";
// import "../styles/components/team.css";
// import "../styles/utils/team__card.css";
// import "../styles/components/project.css";
// import "../styles/components/achievements.css";
// import "../styles/components/conclusion/conclusion.css";
// // import "../styles/components/conclusion/sunSet.css";
// import "../styles/components/contact.css";
// import "../styles/components/mobile-nav.css";
// import "../styles/utils.css";

// import "./vanilla-tilt.js";

// window.scrollTo({ top: 0, behavior: "smooth" }); // NOT WORKING!!!

// import mobileNav from "./components/mobile-nav.js";
// import Three from "./three/three";
// import oceanEffect from "./components/oceanEffect.js";
// import slider from "./components/imageSlider";
// import lazyLoading from "./components/lazy-loading.js";

// lazyLoading();
// slider();
// mobileNav();
// Three();
// oceanEffect();

/////////

// Import styles
// import "../styles/modern-normalize.css";
// import "../styles/style.css";
// import "../styles/components/header.css";
// import "../styles/components/hero.css";
// import "../styles/components/hero-description.css";
// import "../styles/components/hero-downArrow.css";
// import "../styles/utils.css";

// // Immediately needed functionality
// import mobileNav from "./components/mobile-nav.js";
// mobileNav();

// // import Three from "./three/three";
// // Three();

// window.scrollTo({ top: 0, behavior: "smooth" });

// // Lazy load CSS for components that aren't visible immediately
// const loadComponentStyles = () => {
//   import("../styles/components/about-description.css");
//   import("../styles/components/featured.css");
//   import("../styles/components/team.css");
//   import("../styles/utils/team__card.css");
//   import("../styles/components/project.css");
//   import("../styles/components/achievements.css");
//   import("../styles/components/conclusion/conclusion.css");
//   import("../styles/components/contact.css");
//   import("../styles/components/mobile-nav.css");

//   import("./three/three").then((module) => module.default());
//   import("./components/imageSlider").then((module) => module.default());
//   import("./components/oceanEffect").then((module) => module.default());
// };

// // Initialize
// document.addEventListener("DOMContentLoaded", () => {
//   loadComponentStyles();
// });

// // Import lazy loading last as it's not critical
// import("./components/lazy-loading.js").then((module) => module.default());
// import "./vanilla-tilt.js";

//////////////////////////////////////

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

  // history.scrollRestoration = 'manual';

  // // Smooth scroll handler for other interactions
  // const smoothScrollToTop = () => {
  //   window.scrollTo({
  //     top: 0,
  //     behavior: 'smooth'
  //   });
  // };

  // Utils
  import("./vanilla-tilt.js").catch(console.error);
  import("./components/lazy-loading.js").then((module) => module.default());

  // window.addEventListener("load", () => {
  //   window.scrollTo({
  //     top: 0,
  //     behavior: "smooth",
  //   });
  // });

  window.addEventListener("load", () => {
    window.scrollTo({
      top: 0,
      behavior: "auto",
    });
  });
});
