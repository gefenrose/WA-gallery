import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/WA-gallery/",
  build: {
    outDir: "docs"
  },
  plugins: [react()]
});
