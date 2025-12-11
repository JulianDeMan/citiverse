// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      "maplibre-gl",
      "@deck.gl/core",
      "@deck.gl/react",
      "@deck.gl/layers",
      "@deck.gl/geo-layers",
      "@loaders.gl/core",
      "@loaders.gl/3d-tiles"
    ]
  },
  build: {
    sourcemap: false,
    commonjsOptions: { transformMixedEsModules: true },
    rollupOptions: { external: [] }
  }
});
