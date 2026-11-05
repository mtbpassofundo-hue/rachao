"use client";

import { useMemo, useRef, useState } from "react";

import {
  MapaTrajeto,
  type PontoNoMapa,
  type TrechoNoMapa,
} from "@/app/percurso/mapa-trajeto";
import type { TracadoGpx } from "@/lib/gpx";

export type CategoriaTracado = {
  id: string;
  nome: string;
  cor: string;
  distancia: string;
  subida: string;
  tracado: TracadoGpx;
  /** Pontos de apoio já com o quilômetro desta categoria. */
  pontos: PontoNoMapa[];
  /** Trechos com nome próprio, já nos índices desta categoria. */
  trechos: TrechoNoMapa[];
};

const LEGENDA = [
  { tipo: "apoio", cor: "#2d7dff", texto: "Ponto de apoio" },
] as const;

/* ─── Geometria do gráfico, em unidades do viewBox ───────────────────────── */
const G = { largura: 1000, altura: 300, esq: 80, dir: 16, topo: 24, base: 36 };
const PLOT_L = G.largura - G.esq - G.dir;
const PLOT_A = G.altura - G.topo - G.base;

/**
 * Uma leitura do ponto, para a faixa que flutua sobre o mapa.
 *
 * Ficava num quadro acima do mapa, e o ciclista tinha de olhar para cima a
 * cada arraste. Dentro do mapa, o número está ao lado do lugar que ele
 * descreve — e sobra a altura que os quatro quadros ocupavam.
 */
function Leitura({
  rotulo,
  valor,
  nota,
  mono,
  mapa,
}: {
  rotulo: string;
  valor: string;
  nota: string;
  mono?: boolean;
  mapa?: string;
}) {
  return (
    <div className="painel-mapa">
      <dt className="rotulo flex items-center gap-1.5 text-[0.55rem] text-neve-300 sm:text-[0.58rem]">
        {rotulo}
        {mapa && (
          <a
            href={mapa}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir este ponto no Google Maps"
            // O rótulo vai em aria-label, não em texto escondido: dentro de um
            // painel com desfoque de fundo, o `sr-only` deixava um borrão
            // cinza na tela.
            aria-label="Abrir este ponto no Google Maps"
            /* O painel inteiro ignora o ponteiro para não roubar o arraste do
               mapa; só este link volta a aceitar clique. */
            className="pointer-events-auto inline-flex items-center gap-1 text-limao transition hover:text-white"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-3"
              aria-hidden="true"
            >
              <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
              <circle cx="12" cy="10" r="2.6" />
            </svg>
            abrir
          </a>
        )}
      </dt>
      <dd
        className={`mt-0.5 font-bold whitespace-nowrap text-white tabular-nums ${
          mono ? "font-mono text-[0.72rem] sm:text-sm" : "text-sm sm:text-lg"
        }`}
      >
        {valor}
      </dd>
      <dd
        className={`text-[0.6rem] whitespace-nowrap text-neve-300 sm:text-[0.65rem] ${
          mono ? "font-mono tabular-nums" : ""
        }`}
      >
        {nota}
      </dd>
    </div>
  );
}

/** Degraus de inclinação, do plano ao muro. Serve para nomear, não para colorir. */
function nomeDaInclinacao(incl: number): string {
  const v = Math.abs(incl);
  if (v < 2) return incl >= 0 ? "plano" : "plano";
  if (v < 5) return incl > 0 ? "subida leve" : "descida leve";
  if (v < 8) return incl > 0 ? "subida firme" : "descida firme";
  return incl > 0 ? "subida forte" : "descida forte";
}

function formatarKm(metros: number): string {
  return (metros / 1000).toFixed(1).replace(".", ",");
}

export function ExploradorPercurso({
  categorias,
}: {
  categorias: CategoriaTracado[];
}) {
  const [catIdx, setCatIdx] = useState(0);
  const [i, setI] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const arrastando = useRef(false);

  const categoria = categorias[catIdx];
  const apoios = categoria.pontos.filter((p) => p.tipo === "apoio");
  const t = categoria.tracado;
  const ultimo = t.ele.length - 1;
  const atual = Math.min(i, ultimo);

  /* ─── Escalas e caminhos ─────────────────────────────────────────────── */
  const { caminhoArea, caminhoLinha, eixoY, pontoMaisAlto, faixas } = useMemo(() => {
    const min = Math.floor((t.altitudeMin - 10) / 20) * 20;
    const max = Math.ceil((t.altitudeMax + 10) / 20) * 20;

    const x = (k: number) => G.esq + (k / ultimo) * PLOT_L;
    const y = (e: number) => G.topo + PLOT_A - ((e - min) / (max - min)) * PLOT_A;

    const pontos = t.ele.map((e, k) => `${x(k).toFixed(1)},${y(e).toFixed(1)}`);
    const linha = `M ${pontos.join(" L ")}`;
    const area = `${linha} L ${x(ultimo).toFixed(1)},${G.topo + PLOT_A} L ${G.esq},${G.topo + PLOT_A} Z`;

    // Quatro marcas de altitude: o suficiente para dar referência sem poluir.
    const passos = 4;
    const marcas = Array.from({ length: passos + 1 }, (_, n) => {
      const valor = min + ((max - min) * n) / passos;
      return { valor: Math.round(valor), y: y(valor) };
    });

    const indiceAlto = t.ele.indexOf(Math.max(...t.ele));

    /*
     * Trecho com nome também aparece no perfil, não só no mapa.
     *
     * O mapa mostra ONDE fica a parte cronometrada; aqui o ciclista vê o que
     * ela exige das pernas — e dá para comparar com o resto da prova sem
     * trocar de figura. A linha é redesenhada por cima, na cor do trecho.
     */
    const faixas = categoria.trechos.map((trecho) => {
      const de = Math.max(0, Math.min(ultimo, trecho.de));
      const ate = Math.max(de, Math.min(ultimo, trecho.ate));
      const dentro = t.ele
        .slice(de, ate + 1)
        .map((e, k) => `${x(de + k).toFixed(1)},${y(e).toFixed(1)}`);
      return {
        nome: trecho.nome,
        cor: trecho.cor,
        x1: x(de),
        x2: x(ate),
        linha: `M ${dentro.join(" L ")}`,
      };
    });

    return {
      caminhoArea: area,
      caminhoLinha: linha,
      eixoY: marcas,
      pontoMaisAlto: { indice: indiceAlto, x: x(indiceAlto), y: y(t.ele[indiceAlto]) },
      faixas,
    };
  }, [t, ultimo, categoria.trechos]);

  const posX = G.esq + (atual / ultimo) * PLOT_L;
  const minEixo = eixoY[0].valor;
  const maxEixo = eixoY[eixoY.length - 1].valor;
  const posY =
    G.topo + PLOT_A - ((t.ele[atual] - minEixo) / (maxEixo - minEixo)) * PLOT_A;

  /* ─── Interação no gráfico ───────────────────────────────────────────── */
  function indiceDoEvento(clienteX: number): number {
    const svg = svgRef.current;
    if (!svg) return atual;
    const caixa = svg.getBoundingClientRect();
    const relativo = ((clienteX - caixa.left) / caixa.width) * G.largura;
    const fracao = (relativo - G.esq) / PLOT_L;
    return Math.round(Math.min(1, Math.max(0, fracao)) * ultimo);
  }

  const incl = t.incl[atual];

  return (
    <div className="rounded-2xl border border-petroleo-700 bg-petroleo-900 p-5 sm:p-7">
      {/* ─── Seletor de categoria ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="titulo text-2xl text-white">Explore o percurso</h3>
          <p className="mt-1 text-sm text-neve-300">
            Arraste sobre o gráfico para ver cada ponto da prova.
          </p>
        </div>
        <div
          role="group"
          aria-label="Categoria"
          className="flex gap-2 rounded-xl border border-petroleo-700 bg-petroleo-950 p-1"
        >
          {categorias.map((c, n) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setCatIdx(n);
                setI(0);
              }}
              aria-pressed={n === catIdx}
              className={`rotulo rounded-lg px-4 py-2 text-xs transition ${
                n === catIdx
                  ? "text-petroleo-950"
                  : "text-neve-300 hover:text-white"
              }`}
              style={n === catIdx ? { backgroundColor: c.cor } : undefined}
            >
              {c.nome}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-7">
        {/* ─── Mapa com as estradas ───────────────────────────────────── */}
        <figure className="min-w-0">
          <MapaTrajeto
            lat={t.lat}
            lon={t.lon}
            atual={atual}
            cor={categoria.cor}
            chaveCategoria={categoria.id}
            pontos={categoria.pontos}
            trechos={categoria.trechos}
            topo={
              <dl className="flex flex-wrap gap-2">
                <Leitura
                  rotulo="Distância"
                  valor={`${formatarKm(atual * t.passo)} km`}
                  nota={`de ${formatarKm(t.distanciaTotal)} km`}
                />
                <Leitura
                  rotulo="Altitude"
                  valor={`${Math.round(t.ele[atual])} m`}
                  nota={`${t.altitudeMin}–${t.altitudeMax} m`}
                />
              </dl>
            }
            base={
              <dl className="flex flex-wrap gap-2">
                <Leitura
                  rotulo="Inclinação"
                  valor={`${incl > 0 ? "+" : ""}${incl.toFixed(1).replace(".", ",")}%`}
                  nota={nomeDaInclinacao(incl)}
                />
                <Leitura
                  rotulo="Coordenadas"
                  valor={t.lat[atual].toFixed(5)}
                  nota={t.lon[atual].toFixed(5)}
                  mono
                  // Abre o ponto exato no Google Maps. No celular, cai direto
                  // no aplicativo; o formato ?api=1&query= é o que o Google
                  // documenta para isso e não depende de conta logada.
                  mapa={`https://www.google.com/maps/search/?api=1&query=${t.lat[atual]},${t.lon[atual]}`}
                />
              </dl>
            }
          />

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-neve-300">
            {/* A legenda só cita o que esta categoria tem: o Cicloturismo não
                passa pelo ponto de apoio, e explicar um símbolo que não está
                no mapa faz o ciclista procurar o que não existe. */}
            {LEGENDA.filter((item) =>
              categoria.pontos.some((p) => p.tipo === item.tipo),
            ).map((item) => (
              <span key={item.tipo} className="inline-flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block size-3.5 rounded-full border-2 bg-petroleo-950"
                  style={{ borderColor: item.cor }}
                />
                {item.texto}
              </span>
            ))}
            {categoria.trechos.map((trecho) => (
              <span key={trecho.nome} className="inline-flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block h-1.5 w-6 rounded-full"
                  style={{ backgroundColor: trecho.cor }}
                />
                {trecho.nome}
              </span>
            ))}
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="inline-block size-3.5 rounded-full border-2 border-white/60 bg-white"
              />
              Largada e chegada
            </span>
          </div>

          {/* No mapa cabe o símbolo; o nome de quem coordena cabe aqui. */}
          {apoios.length > 0 && (
            <ul className="mt-3 grid gap-1.5 text-xs text-neve-300 sm:grid-cols-3">
              {apoios.map((ponto) => (
                <li key={ponto.nome} className="flex flex-wrap gap-x-2">
                  <span className="font-semibold text-white tabular-nums">
                    km {ponto.km.toFixed(1).replace(".", ",")}
                  </span>
                  <span>{ponto.rotulo ?? ponto.nome}</span>
                  {ponto.detalhe && (
                    <span className="text-neve-500">{ponto.detalhe}</span>
                  )}
                </li>
              ))}
            </ul>
          )}

          <figcaption className="mt-2 text-xs text-neve-500">
            O pontinho marca o lugar exato e a haste leva até o símbolo, que
            fica ao lado para não tapar o traçado. Toque num símbolo para ver o
            nome e o quilômetro; dê zoom para ver os cruzamentos e as
            localidades, e clique no mapa para liberar o zoom pela roda do
            mouse. No celular, os nomes dos pontos aparecem quando você
            aproxima.
          </figcaption>
        </figure>

        {/* ─── Perfil de altimetria ───────────────────────────────────── */}
        <figure className="min-w-0">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${G.largura} ${G.altura}`}
            className="w-full touch-none select-none"
            role="img"
            aria-label={`Perfil de altimetria da categoria ${categoria.nome}: ${categoria.distancia}, altitude entre ${t.altitudeMin} e ${t.altitudeMax} metros.`}
            onPointerDown={(e) => {
              // Mover a posição vem primeiro: a captura do ponteiro é um
              // conforto para o arraste, e se ela falhar não pode levar o
              // clique junto.
              setI(indiceDoEvento(e.clientX));
              arrastando.current = true;
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {
                /* sem captura o arraste ainda funciona dentro do gráfico */
              }
            }}
            onPointerMove={(e) => {
              if (arrastando.current) setI(indiceDoEvento(e.clientX));
            }}
            onPointerUp={() => {
              arrastando.current = false;
            }}
            onPointerCancel={() => {
              arrastando.current = false;
            }}
          >
            {/* grade recessiva */}
            {eixoY.map((m) => (
              <g key={m.valor}>
                <line
                  x1={G.esq}
                  x2={G.largura - G.dir}
                  y1={m.y}
                  y2={m.y}
                  stroke="#11504a"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
                <text x={G.esq - 14} y={m.y + 6} textAnchor="end" className="eixo">
                  {m.valor}
                </text>
              </g>
            ))}

            {/* marcas de distância: as ímpares somem no celular */}
            {Array.from({ length: 5 }, (_, n) => {
              const fracao = n / 4;
              const x = G.esq + fracao * PLOT_L;
              return (
                <text
                  key={n}
                  x={x}
                  y={G.altura - 8}
                  textAnchor={n === 0 ? "start" : n === 4 ? "end" : "middle"}
                  className={`eixo ${n % 2 === 1 ? "eixo-alternada" : ""}`}
                >
                  {formatarKm(fracao * t.distanciaTotal)} km
                </text>
              );
            })}

            {/* A faixa do trecho entra antes do perfil: é fundo, não figura. */}
            {faixas.map((faixa) => (
              <rect
                key={`faixa-${faixa.nome}`}
                x={faixa.x1}
                y={G.topo}
                width={Math.max(0, faixa.x2 - faixa.x1)}
                height={PLOT_A}
                fill={faixa.cor}
                opacity="0.14"
              />
            ))}

            <path d={caminhoArea} fill={categoria.cor} opacity="0.16" />
            <path
              d={caminhoLinha}
              fill="none"
              stroke={categoria.cor}
              strokeWidth="2"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />

            {/* O pedaço cronometrado, redesenhado por cima na cor dele. */}
            {faixas.map((faixa) => (
              <g key={`linha-${faixa.nome}`}>
                {[faixa.x1, faixa.x2].map((px, n) => (
                  <line
                    key={n}
                    x1={px}
                    x2={px}
                    y1={G.topo}
                    y2={G.topo + PLOT_A}
                    stroke={faixa.cor}
                    strokeWidth="1.5"
                    opacity="0.8"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                <path
                  d={faixa.linha}
                  fill="none"
                  stroke={faixa.cor}
                  strokeWidth="2.6"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={(faixa.x1 + faixa.x2) / 2}
                  y={G.topo + 16}
                  textAnchor="middle"
                  className="eixo-nota"
                  fill={faixa.cor}
                >
                  {faixa.nome}
                </text>
              </g>
            ))}

            {/* ponto mais alto, rotulado direto */}
            <circle cx={pontoMaisAlto.x} cy={pontoMaisAlto.y} r="3" fill="#adc4bd" />
            <text
              x={pontoMaisAlto.x}
              y={pontoMaisAlto.y - 12}
              /* Se o pico cair numa ponta, o rótulo centralizado vazaria. */
              textAnchor={
                pontoMaisAlto.x < 180
                  ? "start"
                  : pontoMaisAlto.x > G.largura - 180
                    ? "end"
                    : "middle"
              }
              className="eixo-nota"
            >
              ponto mais alto · {t.altitudeMax} m
            </text>

            {/* cursor */}
            <line
              x1={posX}
              x2={posX}
              y1={G.topo}
              y2={G.topo + PLOT_A}
              stroke="#eef5ef"
              strokeWidth="1"
              strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={posX}
              cy={posY}
              r="7"
              fill={categoria.cor}
              stroke="#072e2d"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <label className="mt-3 block">
            <span className="sr-only">
              Posição no percurso, em quilômetros
            </span>
            <input
              type="range"
              min={0}
              max={ultimo}
              value={atual}
              onChange={(e) => setI(Number(e.target.value))}
              aria-valuetext={`${formatarKm(atual * t.passo)} quilômetros, altitude ${Math.round(t.ele[atual])} metros, inclinação ${incl.toFixed(1)} por cento`}
              className="w-full accent-[var(--cor-categoria)]"
              style={
                { "--cor-categoria": categoria.cor } as React.CSSProperties
              }
            />
          </label>
          <figcaption className="mt-2 text-xs text-neve-500">
            Altitude ao longo do percurso da categoria {categoria.nome}. Dados
            do arquivo GPX, um ponto a cada {t.passo} m.
          </figcaption>
        </figure>

      </div>
    </div>
  );
}
