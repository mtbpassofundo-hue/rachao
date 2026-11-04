import type { MetadataRoute } from "next";

import { EVENTO } from "@/lib/evento";

const enderecoSite = process.env.NEXT_PUBLIC_SITE_URL || EVENTO.site;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: enderecoSite,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${enderecoSite}/inscritos`,
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];
}
