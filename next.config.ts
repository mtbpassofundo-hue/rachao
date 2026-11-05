import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O painel e o relatório guardam CPF e telefone: nada de cache
  // compartilhado nem embed em iframe de terceiro.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/painel/:caminho*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
      {
        source: "/painel",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },

      // Os GPX precisam BAIXAR, não abrir como texto na tela do celular. O
      // atributo `download` do link resolve no computador, mas no Android e
      // no iPhone quem manda é o servidor — daí o Content-Disposition.
      //
      // A ordem importa: quando duas regras casam com a mesma URL, vale a
      // ÚLTIMA. Por isso a genérica vem primeiro e as com nome depois, senão
      // o arquivo baixa sem nome.
      {
        source: "/percurso/:arquivo(.*\\.gpx)",
        headers: [
          { key: "Content-Type", value: "application/gpx+xml" },
          { key: "Content-Disposition", value: "attachment" },
        ],
      },
      {
        source: "/percurso/rachao-comercial-54km.gpx",
        headers: [
          { key: "Content-Type", value: "application/gpx+xml" },
          {
            key: "Content-Disposition",
            value: 'attachment; filename="rachao-comercial-54km.gpx"',
          },
        ],
      },
      {
        source: "/percurso/ciclo-comercial-27km.gpx",
        headers: [
          { key: "Content-Type", value: "application/gpx+xml" },
          {
            key: "Content-Disposition",
            value: 'attachment; filename="ciclo-comercial-27km.gpx"',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
