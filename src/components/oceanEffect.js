const oceanEffect = () => {
  const rays = document.querySelector(".sea__thirdLayer-moonRays");
  const particles = document.querySelector(".sea__thirdLayer-particles");

  function updateMoonrays() {
    for (const child of rays.children) {
      child.style.width = `${Math.random() * 20 + 20}%`;
      child.style.height = `${Math.random() * 200 + 150}%`;
      child.style.animationDuration = `${Math.random() * 10 + 5}s`;
    }
  }
  updateMoonrays();
};

export default oceanEffect;
