import gsap from "gsap";

const slider = () => {
  let cont = document.querySelector(".featured__img-wrapper-container"),
    mainCont = document.querySelector(".container"),
    sections = gsap.utils.toArray(".featured__img-wrapper img"),
    tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".featured__img-container-main",
        pin: true,
        scrub: 1,
        snap: 1 / (sections.length - 1),
        start: "top top",
        end: "+=" + (cont.scrollWidth - mainCont.scrollWidth),
      },
    });

  tl.to(sections, {
    xPercent: -100 * (sections.length - 1),
    ease: "none",
  });
};

export default slider;
