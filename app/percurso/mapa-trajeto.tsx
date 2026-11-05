"use client";

import { useEffect, useRef } from "react";
import type { Map as MapaLeaflet, CircleMarker, Polyline } from "leaflet";

import "leaflet/dist/leaflet.css";

export type PontoNoMapa = {
  nome: string;
  tipo: "apoio" | "marco" | "trecho";
  lat: number;
  lon: number;
  /** Quilômetro em que o ponto cai na categoria exibida. */
  km: number;
  numero?: number;
  rotulo?: string;
  detalhe?: string;
  /** Multiplicador da distância que o selo se afasta do traçado. */
  desvio?: number;
  /** Direção de fuga do selo, em coordenadas de tela (x à direita, y abaixo). */
  dx: number;
  dy: number;
};

export type TrechoNoMapa = {
  nome: string;
  cor: string;
  /** Índices do começo e do fim no traçado da categoria exibida. */
  de: number;
  ate: number;
  kmDe: number;
  kmAte: number;
  /** Meio do trecho, onde o rótulo se pendura. */
  lat: number;
  lon: number;
  dx: number;
  dy: number;
};

type Props = {
  lat: readonly number[];
  lon: readonly number[];
  /** Índice do ponto selecionado no gráfico de altimetria. */
  atual: number;
  cor: string;
  /** Muda quando o ciclista troca de categoria: refaz o traçado e reenquadra. */
  chaveCategoria: string;
  pontos: PontoNoMapa[];
  trechos: TrechoNoMapa[];
  /** Faixa que flutua sobre o topo do mapa. */
  topo?: React.ReactNode;
  /** Faixa que flutua sobre a base, acima da atribuição do OpenStreetMap. */
  base?: React.ReactNode;
};

/* ─── Símbolos dos pontos de apoio ────────────────────────────────────────
   Desenhados aqui em vez de virem de arquivo: são quatro traços cada um, e
   assim não há imagem para carregar nem ícone quebrado se o arquivo sumir. */
const GLIFOS: Record<string, string> = {
  /** Garrafa: é o que tem no ponto de apoio. */
  apoio:
    '<path d="M9 2h4v2.2l1.2 1.6a3 3 0 0 1 .6 1.8V20a2 2 0 0 1-2 2h-3.6a2 2 0 0 1-2-2V7.6a3 3 0 0 1 .6-1.8L9 4.2V2Z"/><rect x="7.2" y="10" width="7.6" height="3" fill="#03171a"/>',
  /** Bandeirada, para o começo e o fim do trecho cronometrado. */
  trecho:
    '<path d="M5 2v20h2v-8.4l11-4.2V2.6L7 6.8V2H5Z"/><rect x="9" y="4.6" width="3" height="3" fill="#03171a"/><rect x="15" y="2.6" width="3" height="3" fill="#03171a"/><rect x="12" y="8.6" width="3" height="3" fill="#03171a"/>',
};

const CORES: Record<string, string> = {
  // Azul para o apoio: o vermelho e o amarelo já são as linhas da prova, e
  // o selo não pode ser confundido com traçado.
  apoio: "#2d7dff",
  // O mesmo amarelo do trecho da corrida, para o rótulo e a linha se
  // reconhecerem como a mesma coisa.
  trecho: "#ffc400",
  marco: "#dfe4ec",
};

/**
 * Distância, em pixels, entre o lugar exato e o selo que o aponta.
 *
 * Acompanha o tamanho do mapa: no celular, uma haste de 46 px jogaria metade
 * dos selos para fora da caixa.
 */
type Medidas = { fuga: number; limite: number };

function medidasDoMapa(largura: number): Medidas {
  return {
    // Proporção da imagem do percurso: lá o selo tem 80 px e a haste 78, num
    // mapa de 1000. O mínimo acompanha o raio do selo — mais curto que isso e
    // o símbolo volta a encostar no traçado, que é o que a haste resolveu.
    fuga: Math.round(Math.max(28, Math.min(46, largura / 18))),
    // Teto do afastamento: numa caixa pequena, uma haste comprida jogaria o
    // selo para fora do mapa.
    limite: largura * 0.2,
  };
}

/** Deslocamento do selo em relação ao lugar exato, em pixels de tela. */
function deslocamento(ponto: PontoNoMapa, medidas: Medidas) {
  const escala = Math.min(medidas.fuga * (ponto.desvio ?? 1), medidas.limite);
  return {
    dx: Math.round(ponto.dx * escala),
    dy: Math.round(ponto.dy * escala),
  };
}

/**
 * Zoom extra, a partir do enquadramento inicial, para os nomes aparecerem.
 *
 * Com o percurso inteiro na tela, dez nomes escritos tapam o mapa — foi essa a
 * reclamação. Então de longe ficam só os símbolos, e o nome aparece quando o
 * ciclista aproxima para olhar um trecho.
 */
const ZOOM_DOS_NOMES = 2;

/**
 * O selo de um ponto, deslocado do traçado e ligado a ele por uma haste.
 *
 * Em cima da linha da prova o símbolo tapava justamente o cruzamento que o
 * ciclista queria olhar. Agora o lugar exato é um pontinho, e o símbolo fica
 * ao lado. Como o deslocamento é em pixels, ele não muda de tamanho com o
 * zoom: o mapa aproxima, a haste continua do mesmo comprimento na tela.
 */
function haste(ponto: PontoNoMapa, medidas: Medidas): string {
  const cor = CORES[ponto.tipo];
  const { dx, dy } = deslocamento(ponto, medidas);
  return `<span class="pin pin-${ponto.tipo}" style="--b:${cor}">
    <svg class="pin-haste" viewBox="-200 -200 400 400" width="400" height="400" aria-hidden="true">
      <line x1="0" y1="0" x2="${dx}" y2="${dy}" stroke="#03171a" stroke-width="5" stroke-linecap="round"/>
      <line x1="0" y1="0" x2="${dx}" y2="${dy}" stroke="${cor}" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="0" cy="0" r="4.5" fill="${cor}" stroke="#03171a" stroke-width="2"/>
    </svg>
  </span>`;
}

/** O selo e o nome, sem a haste: eles moram em camadas diferentes do mapa. */
function selo(ponto: PontoNoMapa, medidas: Medidas): string {
  const cor = CORES[ponto.tipo];
  const { dx, dy } = deslocamento(ponto, medidas);

  const corpo =
    ponto.tipo === "marco"
      ? `<span class="pin-texto" style="left:${dx}px;top:${dy}px">${ponto.nome}</span>`
      : `<span class="pin-selo" style="left:${dx}px;top:${dy}px">
           <svg viewBox="0 0 22 24" aria-hidden="true">${GLIFOS[ponto.tipo]}</svg>
           ${ponto.numero ? `<b class="pin-num">${ponto.numero}</b>` : ""}
         </span>
         ${
           ponto.rotulo
             ? /* Selo para cima, nome para cima também: embaixo ele cairia
                  no meio do caminho entre o selo e o traçado. */
               dy < -6
               ? `<span class="pin-rotulo pin-rotulo-cima" style="left:${dx}px;top:${dy - 24}px">${ponto.rotulo}</span>`
               : `<span class="pin-rotulo" style="left:${dx}px;top:${dy + 24}px">${ponto.rotulo}</span>`
             : ""
         }`;

  return `<span class="pin pin-${ponto.tipo}" style="--b:${cor}">${corpo}</span>`;
}

/**
 * Mapa com as estradas por baixo do traçado da prova.
 *
 * O Leaflet mexe em `window` assim que é importado, e componente cliente do
 * App Router também roda no servidor na primeira renderização. Por isso ele é
 * importado dentro do efeito, nunca no topo do arquivo.
 */
export function MapaTrajeto({
  lat,
  lon,
  atual,
  cor,
  chaveCategoria,
  pontos,
  trechos,
  topo,
  base,
}: Props) {
  const caixa = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaLeaflet | null>(null);
  const linhaToda = useRef<Polyline | null>(null);
  const linhaFeita = useRef<Polyline | null>(null);
  const alfinete = useRef<CircleMarker | null>(null);
  const largada = useRef<CircleMarker | null>(null);
  const apoios = useRef<{ remove: () => void }[]>([]);
  const aoAproximar = useRef<(() => void) | null>(null);

  // Monta o mapa uma vez.
  useEffect(() => {
    let vivo = true;
    let criado: MapaLeaflet | null = null;

    (async () => {
      const L = await import("leaflet");
      if (!vivo || !caixa.current || mapa.current) return;

      criado = L.map(caixa.current, {
        zoomControl: true,
        scrollWheelZoom: false, // senão a roda do mouse prende a rolagem da página
        attributionControl: true,
        // Sem passo fracionário, o enquadramento arredonda o zoom para baixo e
        // o percurso encolhe para metade da caixa por causa de alguns pixels.
        zoomSnap: 0.25,
      });

      /*
       * As hastes moram numa camada abaixo da dos selos. Cada ponto é um
       * marcador independente, e o Leaflet empilha marcador sobre marcador
       * pela latitude: sem isso, a haste de um ponto passava por cima do selo
       * do vizinho. Com duas camadas, selo nenhum fica por baixo de linha.
       */
      const camada = criado.createPane("hastes");
      camada.style.zIndex = "580"; // entre o traçado (400) e os selos (600)
      camada.style.pointerEvents = "none";
      mapa.current = criado;

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(criado);

      // Um toque no mapa libera a roda; assim ele não sequestra a rolagem
      // de quem está só passando pela página.
      criado.on("click", () => criado?.scrollWheelZoom.enable());
      criado.on("mouseout", () => criado?.scrollWheelZoom.disable());
    })();

    return () => {
      vivo = false;
      criado?.remove();
      mapa.current = null;
    };
  }, []);

  // Desenha o traçado e reenquadra quando a categoria muda.
  useEffect(() => {
    let vivo = true;
    (async () => {
      const L = await import("leaflet");
      const m = mapa.current;
      if (!vivo || !m) return;

      const traco = lat.map((v, i) => [v, lon[i]] as [number, number]);

      linhaToda.current?.remove();
      linhaFeita.current?.remove();
      alfinete.current?.remove();
      largada.current?.remove();
      for (const marcador of apoios.current) marcador.remove();
      apoios.current = [];

      // Contorno escuro por baixo da linha: sobre o mapa claro do
      // OpenStreetMap, o amarelo da Sport sozinho quase sumia.
      apoios.current.push(
        L.polyline(traco, { color: "#03171a", weight: 9, opacity: 0.3 }).addTo(m),
      );

      // O trecho já percorrido se distingue pela espessura, não por
      // transparência: cor clara translúcida sobre o contorno escuro vira
      // oliva, e a linha da Sport deixava de parecer amarela.
      linhaToda.current = L.polyline(traco, {
        color: cor,
        weight: 4,
        opacity: 1,
      }).addTo(m);

      linhaFeita.current = L.polyline([], {
        color: cor,
        weight: 7,
        opacity: 1,
      }).addTo(m);

      // ─── Trechos com nome ──────────────────────────────────────────
      // Por cima da linha da prova, e verdes nas três categorias: a trilha
      // não é de uma nem de outra, as duas passam por ela.
      for (const trecho of trechos) {
        apoios.current.push(
          L.polyline(traco.slice(trecho.de, trecho.ate + 1), {
            color: trecho.cor,
            weight: 6,
            opacity: 1,
          }).addTo(m),
        );
      }

      largada.current = L.circleMarker(traco[0], {
        radius: 6,
        color: "#03171a",
        weight: 2,
        fillColor: "#ffffff",
        fillOpacity: 1,
      })
        .addTo(m)
        .bindTooltip("Largada e chegada");

      alfinete.current = L.circleMarker(traco[0], {
        radius: 8,
        color: "#ffffff",
        weight: 3,
        fillColor: cor,
        fillOpacity: 1,
      }).addTo(m);

      // ─── Pontos de apoio ───────────────────────────────────────────
      const medidas = medidasDoMapa(m.getSize().x);
      // Mapa pequeno, selo pequeno: no celular o percurso inteiro cabe em
      // uns 200 px e dez selos de tamanho normal viram um amontoado.
      caixa.current?.classList.toggle("selos-miudos", medidas.fuga < 40);
      for (const ponto of pontos) {
        const { dx, dy } = deslocamento(ponto, medidas);
        apoios.current.push(
          L.marker([ponto.lat, ponto.lon], {
            icon: L.divIcon({
              className: "",
              html: haste(ponto, medidas),
              iconSize: [0, 0],
              iconAnchor: [0, 0],
            }),
            pane: "hastes",
            interactive: false,
            keyboard: false,
          }).addTo(m),
        );

        const marcador = L.marker([ponto.lat, ponto.lon], {
          icon: L.divIcon({
            className: "",
            html: selo(ponto, medidas),
            iconSize: [0, 0],
            iconAnchor: [0, 0],
          }),
          interactive: ponto.tipo !== "marco",
          keyboard: false,
          title: `${ponto.nome} · km ${ponto.km.toFixed(1).replace(".", ",")}`,
          alt: ponto.nome,
        }).addTo(m);

        if (ponto.tipo !== "marco") {
          const km = ponto.km.toFixed(1).replace(".", ",");
          marcador.bindTooltip(
            `${ponto.nome}<br><small>km ${km}${ponto.detalhe ? ` · ${ponto.detalhe}` : ""}</small>`,
            // O balão segue o selo, não o pontinho: é no selo que se toca.
            { direction: "top", offset: [dx, dy - 26] },
          );
        }
        apoios.current.push(marcador);
      }

      // ─── Rótulo dos trechos ────────────────────────────────────────
      for (const trecho of trechos) {
        const km = (v: number) => v.toFixed(1).replace(".", ",");
        const como: PontoNoMapa = {
          nome: trecho.nome,
          tipo: "trecho" as PontoNoMapa["tipo"],
          lat: trecho.lat,
          lon: trecho.lon,
          km: trecho.kmDe,
          rotulo: trecho.nome,
          dx: trecho.dx,
          dy: trecho.dy,
        };
        const { dx, dy } = deslocamento(como, medidas);

        apoios.current.push(
          L.marker([trecho.lat, trecho.lon], {
            icon: L.divIcon({
              className: "",
              html: haste(como, medidas),
              iconSize: [0, 0],
              iconAnchor: [0, 0],
            }),
            pane: "hastes",
            interactive: false,
            keyboard: false,
          }).addTo(m),
        );

        apoios.current.push(
          L.marker([trecho.lat, trecho.lon], {
            icon: L.divIcon({
              className: "",
              html: selo(como, medidas),
              iconSize: [0, 0],
              iconAnchor: [0, 0],
            }),
            keyboard: false,
            title: `${trecho.nome} · km ${km(trecho.kmDe)} a ${km(trecho.kmAte)}`,
          })
            .addTo(m)
            .bindTooltip(
              `${trecho.nome}<br><small>km ${km(trecho.kmDe)} a ${km(trecho.kmAte)}</small>`,
              { direction: "top", offset: [dx, dy - 26] },
            ),
        );
      }

      /*
       * A folga tem de caber o selo mais afastado, não a haste padrão.
       *
       * Com folga fixa, um ponto que cai na ponta do traçado empurrava o selo
       * para fora da caixa: foi o que aconteceu com o apoio no mapa do
       * Cicloturismo, que termina justamente nele. Aqui o maior deslocamento
       * de verdade é medido, e a ele se somam o raio do selo e a etiqueta que
       * pendura embaixo.
       */
      const alcance = [
        ...pontos,
        ...trechos.map((t) => ({ ...t, desvio: undefined })),
      ].reduce((maior, ponto) => {
        const { dx, dy } = deslocamento(ponto as PontoNoMapa, medidas);
        return Math.max(maior, Math.abs(dx), Math.abs(dy));
      }, medidas.fuga);

      m.fitBounds(linhaToda.current.getBounds(), {
        padding: [alcance + 40, alcance + 40],
      });

      // Os nomes entram só depois de o ciclista aproximar dois níveis.
      const base = m.getZoom();
      const mostrarNomes = () =>
        caixa.current?.classList.toggle(
          "com-nomes",
          m.getZoom() >= base + ZOOM_DOS_NOMES,
        );
      mostrarNomes();
      // Trocar de categoria refaz o enquadramento, então o ouvinte anterior
      // sai: senão ficam vários, cada um com o seu zoom de referência.
      if (aoAproximar.current) m.off("zoomend", aoAproximar.current);
      aoAproximar.current = mostrarNomes;
      m.on("zoomend", mostrarNomes);
    })();
    return () => {
      vivo = false;
    };
  }, [chaveCategoria, lat, lon, cor, pontos, trechos]);

  // Move o alfinete conforme o ciclista arrasta o gráfico.
  useEffect(() => {
    const m = mapa.current;
    const ponto = alfinete.current;
    if (!m || !ponto || atual >= lat.length) return;

    const posicao: [number, number] = [lat[atual], lon[atual]];
    ponto.setLatLng(posicao);
    linhaFeita.current?.setLatLngs(
      lat.slice(0, atual + 1).map((v, i) => [v, lon[i]] as [number, number]),
    );

    // Acompanha o alfinete se ele sair da área visível — útil quando a pessoa
    // deu zoom para olhar um cruzamento e continua arrastando.
    if (!m.getBounds().pad(-0.15).contains(posicao)) {
      m.panTo(posicao, { animate: true, duration: 0.3 });
    }
  }, [atual, lat, lon]);

  return (
    /* O percurso é quase quadrado: numa caixa larga e baixa ele ficava
       miúdo no meio, com os dois lados vazios. */
    <div className="relative mx-auto h-[360px] w-full max-w-[760px] sm:h-[480px] lg:h-[560px]">
      <div
        ref={caixa}
        className="absolute inset-0 rounded-xl border border-petroleo-700 bg-petroleo-950"
        role="application"
        aria-label="Mapa do percurso com as estradas e localidades. Arraste o gráfico de altimetria para mover o ponto no mapa."
      />

      {/*
       * As leituras flutuam sobre o mapa, não acima dele.
       *
       * z-[1000] passa por cima dos painéis do Leaflet, que param em 800. O
       * ponteiro atravessa: sem isso, arrastar o mapa onde há faixa não
       * funcionaria — só o link do Google Maps volta a aceitar clique.
       *
       * A faixa de cima começa depois do controle de zoom, que mora no canto
       * esquerdo; a de baixo para antes da atribuição do OpenStreetMap, que é
       * obrigatória e não pode ficar escondida.
       */}
      {topo && (
        <div className="pointer-events-none absolute top-2.5 right-2.5 left-14 z-[1000]">
          {topo}
        </div>
      )}
      {base && (
        <div className="pointer-events-none absolute right-2.5 bottom-7 left-2.5 z-[1000]">
          {base}
        </div>
      )}
    </div>
  );
}
