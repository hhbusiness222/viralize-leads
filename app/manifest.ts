import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Viralize CRM",
    short_name: "Viralize",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f6fa",
    theme_color: "#ffffff",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
