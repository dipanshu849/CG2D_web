const lazyLoading = () => {
  const lazyImages = document.querySelectorAll(".lazy");

  const oberver = new IntersectionObserver((entries, oberver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        let img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove("loading");
        img.classList.add("loaded");
        oberver.unobserve(img);
      }
    });
  });

  lazyImages.forEach((image) => {
    oberver.observe(image);
  });
};

export default lazyLoading;
