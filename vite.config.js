import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "http://corporationcentral2.mhbjplok.com", // The URL of the API server
        changeOrigin: true, // Ensures the API sees the correct origin
        secure: false, // For allowing requests over HTTP (not HTTPS)
        rewrite: (path) => path.replace(/^\/api/, ""), // Remove /api prefix
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            console.log("Proxy error:", err);
          });
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            console.log("Sending Request to the Target:", req.method, req.url);
          });
          proxy.on("proxyRes", (proxyRes, req, _res) => {
            console.log(
              "Received Response from the Target:",
              proxyRes.statusCode,
              req.url
            );
          });
        },
      },
      '/panel-api': {
        target: 'http://ntmc2.mhbjplok.com', // Default panel API server
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/panel-api/, ""),
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            console.log("Panel API Proxy error:", err);
          });
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            console.log("Sending Panel API Request:", req.method, req.url);
          });
          proxy.on("proxyRes", (proxyRes, req, _res) => {
            console.log(
              "Received Panel API Response:",
              proxyRes.statusCode,
              req.url
            );
          });
        },
      },
      '/corporation-api': {
        target: 'http://corporationcentral2.mhbjplok.com', // Corporation Central 2 API server
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/corporation-api/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Corporation API Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Corporation API Request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Corporation API Response:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/corporation-panel-api': {
        target: 'http://corporationcentral2.mhbjplok.com', // Corporation Central 2 API server for panel data
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/corporation-panel-api/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Corporation Panel API Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Corporation Panel API Request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Corporation Panel API Response:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
});
