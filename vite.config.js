import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["three"],
          "three-addons": ["three/examples/jsm/Addons.js"],
          gsap: ["gsap", "gsap/ScrollTrigger"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
