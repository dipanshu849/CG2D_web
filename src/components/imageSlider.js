const slider = () => {
  let sliderContainer = document.querySelector(".featured__img-container-main");
  let widthSliderContainer = sliderContainer.offsetWidth;
  let imgContainer = document.querySelector(".featured__img-wrapper-container");

  window.addEventListener("resize", () => {
    widthSliderContainer = sliderContainer.offsetWidth;
  });

  const handleMove = (x) => {
    imgContainer.style.transform = `translateX(${
      (x / widthSliderContainer) * -75
    }%)`;
    imgContainer.style.transition = "transform 0.1s";
  };

  sliderContainer.addEventListener("mouseleave", () => {
    imgContainer.style.transition = "transform 1.5s ease-in-out";
    imgContainer.style.transform = `translateX(0%)`;
  });

  // sliderContainer.addEventListener("mouseenter", () => {
  //   imgContainer.style.transition = "transform 0.5s ease-in-out";
  // });

  sliderContainer.addEventListener("mousemove", (e) => {
    handleMove(e.offsetX);
  });

  sliderContainer.addEventListener("touchmove", (e) => {
    const touch = e.touches[0];
    const rect = sliderContainer.getBoundingClientRect();
    const offsetX = touch.clientX - rect.left;
    handleMove(offsetX);
  });

  sliderContainer.addEventListener("touchend", () => {
    imgContainer.style.transition = "transform 1.5s ease-in-out";
    imgContainer.style.transform = `translateX(0%)`;
  });
};

export default slider;
