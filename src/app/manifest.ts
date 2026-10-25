import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "CareMetrics",
    short_name: "CareMetrics",
    description:
      "Care and workforce management for authorised CareMetrics staff.",
    lang: "en-NZ",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4f6f9",
    theme_color: "#1a6b7a",
    prefer_related_applications: false,
    icons: [192, 512].flatMap((size) => [
      {
        src: `/icons/caremetrics-${size}.png`,
        sizes: `${size}x${size}`,
        type: "image/png",
        purpose: "any",
      },
      {
        src: `/icons/caremetrics-maskable-${size}.png`,
        sizes: `${size}x${size}`,
        type: "image/png",
        purpose: "maskable",
      },
    ]),
  }
}
