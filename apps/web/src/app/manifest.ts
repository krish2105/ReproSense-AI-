import type { MetadataRoute } from "next";

// Installable web app (A6): the phone app for build week. Opens on Demo people; her own pages need a demo sign-in.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "ReproSense",
    short_name: "ReproSense",
    description: "Your cycle record, patterns worth discussing and a doctor-ready report. Information, not a diagnosis.",
    start_url: "/demo?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F6F1F4",
    theme_color: "#4B3653",
    categories: ["health", "medical"],
    icons: [
      { src: "/images/brand/derived/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/images/brand/derived/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/images/brand/derived/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
