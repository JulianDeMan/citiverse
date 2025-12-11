import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Belangrijk: voorkom dubbele exemplaren van deck.gl/luma/react
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: [
      "react",
      "react-dom",
      "@deck.gl/core",
      "@deck.gl/react",
      "@deck.gl/layers",
      "@deck.gl/geo-layers",
      "@luma.gl/core",
      "@luma.gl/engine",
      "luma.gl"
    ],
    alias: {
      // Forceer één pad per lib (helpt Vite bij het bundelen)
      "@deck.gl/core": "@deck.gl/core",
      "@deck.gl/react": "@deck.gl/react",
      "@deck.gl/layers": "@deck.gl/layers",
      "@deck.gl/geo-layers": "@deck.gl/geo-layers",
      "@luma.gl/core": "@luma.gl/core",
      "@luma.gl/engine": "@luma.gl/engine"
    }
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true
      }
    }
  },
  optimizeDeps: {
    include: [
      "@deck.gl/core",
      "@deck.gl/react",
      "@deck.gl/layers",
      "@deck.gl/geo-layers",
      "@luma.gl/core",
      "@luma.gl/engine"
    ]
  }
});
