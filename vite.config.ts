import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// Bundles the whole app (JS, CSS, and the inlined UAE GeoJSON) into ONE
// self-contained index.html that runs offline with a double-click.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    target: "es2019",
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 5000,
  },
});
