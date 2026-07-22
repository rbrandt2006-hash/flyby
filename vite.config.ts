import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// The Flyby AI Flask backend (../flyby_ai). Every backend path is proxied to it,
// so in development the browser talks to the dev server same-origin — no CORS
// setup, and no backend host baked into the app.
//
// Set VITE_API_URL to point at a backend on another host (split deploy).
const BACKEND_URL = process.env.VITE_API_URL || "http://localhost:8659";

const BACKEND_PATHS = ["/api", "/auth", "/rest", "/functions", "/storage", "/health"];

// Security headers browsers only honour over HTTP — setting them in a <meta>
// tag does nothing. Sent here in development; in production whatever serves
// `dist/` needs to send the same set.
const SECURITY_HEADERS = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(self), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: SECURITY_HEADERS,
    proxy: Object.fromEntries(
      BACKEND_PATHS.map((prefix) => [prefix, { target: BACKEND_URL, changeOrigin: true }]),
    ),
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));
