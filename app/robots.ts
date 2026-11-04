import type { MetadataRoute } from "next";

import { EVENTO } from "@/lib/evento";

const enderecoSite = process.env.NEXT_PUBLIC_SITE_URL || EVENTO.site;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // O painel guarda CPF e telefone. Não é o robots que protege — quem
      // protege é a senha —, mas não há por que o endereço circular.
      disallow: ["/painel", "/painel/"],
    },
    sitemap: `${enderecoSite}/sitemap.xml`,
  };
}
