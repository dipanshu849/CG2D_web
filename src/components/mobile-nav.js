const mobileNav = () => {
  const headerBtn = document.querySelector(".header__bars");
  const nav = document.querySelector(".mobile-nav");
  const mobileNavLinks = document.querySelectorAll(".mobile-nav__link");

  let isMobileNavOpen = false;

  headerBtn.addEventListener("click", () => {
    isMobileNavOpen = !isMobileNavOpen;
    if (isMobileNavOpen) {
      nav.style.display = "flex";
      document.body.style.overflowY = "hidden";
    } else {
      nav.style.display = "none";
      document.body.style.overflowY = "auto";
    }
  });

  mobileNavLinks.forEach((link) => {
    link.addEventListener("click", () => {
      nav.style.display = "none";
      document.body.style.overflowY = "auto";
      isMobileNavOpen = false;
    });
  });
};

export default mobileNav;
