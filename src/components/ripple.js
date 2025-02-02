const ripple = () => {
  const seaThirdLayer = document.querySelector(".sea__thirdLayer");
  const brushes = [];
  const waves = 50;
  let currentWave = 0;
  const mouse = { x: 0, y: 0 };
  const mouseLast = { x: 0, y: 0 };

  // Create brushes
  for (let i = 0; i < waves; i++) {
    const brush = document.createElement("img");
    brush.src = "/effectImages/ripple.png";
    brush.alt = "image for ripple effect";
    brush.classList.add("brush");
    brush.style.position = "absolute";
    brush.style.opacity = "0";
    brush.style.transform = "translate(-50%, -50%) scale(0.2) rotate(0deg)"; // Added initial rotation
    brush.dataset.active = "false"; // Initialize as inactive
    seaThirdLayer.appendChild(brush);
    brushes.push(brush);
  }

  seaThirdLayer.addEventListener("mousemove", function (event) {
    const rect = seaThirdLayer.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
  });

  function setNewWave(x, y, index) {
    const ripple = brushes[index];
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.opacity = "0.5";
    ripple.style.transform = "translate(-50%, -50%) scale(0.2) rotate(0deg)"; // Reset rotation
    ripple.dataset.scale = "0.2";
    ripple.dataset.rotate = "0"; // Track rotation angle
    ripple.dataset.active = "true";
  }

  function trackMousePosition() {
    if (
      Math.abs(mouse.x - mouseLast.x) < 4 &&
      Math.abs(mouse.y - mouseLast.y) < 4
    ) {
      return;
    }

    setNewWave(mouse.x, mouse.y, currentWave);
    currentWave = (currentWave + 1) % waves;
    mouseLast.x = mouse.x;
    mouseLast.y = mouse.y;
  }

  function animate() {
    trackMousePosition();
    brushes.forEach((brush) => {
      if (brush.dataset.active === "true") {
        const currentOpacity = parseFloat(brush.style.opacity);
        const currentScale = parseFloat(brush.dataset.scale);
        const currentRotation = parseFloat(brush.dataset.rotate || "0");

        // Update opacity
        const newOpacity = currentOpacity * 0.94;
        brush.style.opacity = newOpacity;

        // Update scale
        const newScale = Math.min(currentScale * 0.94 + 0.1, 1.0);
        brush.dataset.scale = newScale;

        // Update rotation - rotate slowly
        const newRotation = (currentRotation + 1) % 360; // Adjust this value to rotate faster or slower
        brush.dataset.rotate = newRotation;

        // Apply all transforms
        brush.style.transform = `translate(-50%, -50%) scale(${newScale}) rotate(${newRotation}deg)`;

        // Reset when faded out
        if (newOpacity < 0.1) {
          brush.dataset.active = "false";
          brush.style.opacity = "0";
          brush.dataset.scale = "0.2"; // Reset scale
          brush.dataset.rotate = "0"; // Reset rotation
          brush.style.transform =
            "translate(-50%, -50%) scale(0.1) rotate(0deg)";
        }
      }
    });
  }

  const timer = setInterval(animate, 1000 / 60);
  return () => clearInterval(timer);
};

export default ripple;
