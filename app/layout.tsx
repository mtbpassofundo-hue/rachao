import type { Metadata, Viewport } from "next";

import { EVENTO } from "@/lib/evento";
import "./globals.css";

const DESCRICAO = `A inscrição do ${EVENTO.nome} custa um brinquedo. Entregue em um dos quatro pontos de coleta até ${EVENTO.prazoBrinquedoCurto} e pedale no dia ${EVENTO.dataCurta}, na ${EVENTO.sede}, em ${EVENTO.cidade}.`;

/**
 * Endereço público do site — é o que transforma "/fotos/largada-og.jpg" na
 * URL absoluta que o WhatsApp precisa para mostrar a miniatura.
 *
 * NEXT_PUBLIC_SITE_URL existe para o dia em que o clube quiser domínio
 * próprio: basta cadastrar a variável na Vercel, sem tocar no código.
 */
const enderecoSite = process.env.NEXT_PUBLIC_SITE_URL || EVENTO.site;

export const metadata: Metadata = {
  metadataBase: new URL(enderecoSite),
  title: {
    default: `${EVENTO.nome} — a inscrição é um brinquedo`,
    template: `%s · ${EVENTO.nome}`,
  },
  description: DESCRICAO,
  applicationName: EVENTO.nome,
  openGraph: {
    title: `${EVENTO.nome} · ${EVENTO.dataCurta}`,
    description: DESCRICAO,
    locale: "pt_BR",
    type: "website",
    /*
     * A foto, e não o flyer, é a miniatura que o WhatsApp mostra.
     *
     * O flyer é um retrato cheio de texto miúdo; recortado no quadro que o
     * WhatsApp usa, vira uma tarja verde ilegível. A foto já está cortada em
     * 1200x630, a proporção que esses aplicativos esperam, e diz num relance
     * do que se trata.
     */
    images: [
      {
        url: "/fotos/largada-og.jpg",
        width: 1200,
        height: 630,
        alt: `Ciclistas e uma criança na largada do ${EVENTO.nome}`,
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#03171a",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
