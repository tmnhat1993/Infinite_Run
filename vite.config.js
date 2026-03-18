import { defineConfig } from "vite";

export default defineConfig({
  // Deploy target: https://tmnhat1993.github.io/Infinite_Run/dist/
  // so assets must be resolved from this base path.
  base: "/Infinite_Run/dist/",
  build: {
    target: "es2015",
  },
});

