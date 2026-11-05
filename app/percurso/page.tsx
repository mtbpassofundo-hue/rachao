import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { IconeWhatsapp } from "@/app/componentes/icone-whatsapp";
import { ExploradorPercurso } from "@/app/percurso/explorador";
import { CONTATOS, EVENTO, GRUPO } from "@/lib/evento";
import { direcaoDeFuga, lerTracado, ondeNoTracado } from "@/lib/gpx";
import {
  CATEGORIAS,
  PONTOS_INTERESSE,
  REFERENCIAS,
  TRECHOS,
} from "@/lib/percurso";

export const metadata: Metadata = {
  title: "Percurso",
  description: `Percurso oficial do ${EVENTO.nome}: mapa das estradas, altimetria e download dos arquivos GPX do Rachão (54,5 km) e do Cicloturismo (27,6 km).`,
  openGraph: {
    title: `Percurso · ${EVENTO.nome}`,
    description:
      "Explore o trajeto ponto a ponto e baixe o GPX: Rachão 54,5 km, com 26,8 km de disputa, e Cicloturismo 27,6 km.",
    locale: "pt_BR",
    type: "website",
  },
};

// "Mapa" e não "Percurso": dentro da página do percurso, um link com o nome
// da própria página faz esperar o topo e entregar o meio dela.
const LINKS = [
  { href: "#percurso", texto: "Mapa" },
  { href: "#corrida", texto: "A corrida" },
  { href: "#gpx", texto: "GPX" },
];

/**
 * Distância máxima, em metros, para um ponto de interesse valer numa
 * categoria.
 *
 * O ponto de apoio do Rachão fica 2 km fora do traçado do Cicloturismo. Sem
 * este corte, `ondeNoTracado` devolveria o quilômetro do ponto mais próximo e
 * o selo apareceria no mapa do Cicloturismo como se ele passasse por lá.
 */
const DISTANCIA_MAXIMA = 150;

function IconeBaixar({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3v12" />
      <path d="m7 11 5 5 5-5" />
      <path d="M4 20h16" />
    </svg>
  );
}

export default function PercursoPagina() {
  // Os GPX são lidos na geração da página: o que vai para o navegador é o
  // traçado reamostrado a cada 100 m, não o arquivo de 80 KB.
  const tracados = CATEGORIAS.map((categoria) => {
    const tracado = lerTracado(categoria.arquivo);

    const pontos = PONTOS_INTERESSE.map((ponto) => {
      const { km, metrosDoTracado } = ondeNoTracado(
        tracado,
        ponto.lat,
        ponto.lon,
      );
      return {
        ...ponto,
        km,
        metrosDoTracado,
        ...(ponto.para ?? direcaoDeFuga(tracado, ponto.lat, ponto.lon)),
      };
    }).filter((ponto) => ponto.metrosDoTracado <= DISTANCIA_MAXIMA);

    const trechos = TRECHOS.filter((t) => t.categoria === categoria.id).map(
      (trecho) => {
        const de = Math.round((trecho.kmDe * 1000) / tracado.passo);
        const ate = Math.round((trecho.kmAte * 1000) / tracado.passo);
        // O rótulo se pendura no meio do trecho, que é o ponto mais longe das
        // duas pontas — ali ele não briga com o selo do apoio.
        const meio = Math.round((de + ate) / 2);
        return {
          nome: trecho.nome,
          cor: trecho.cor,
          de,
          ate,
          kmDe: trecho.kmDe,
          kmAte: trecho.kmAte,
          lat: tracado.lat[meio],
          lon: tracado.lon[meio],
          ...direcaoDeFuga(tracado, tracado.lat[meio], tracado.lon[meio]),
        };
      },
    );

    return {
      id: categoria.id,
      nome: categoria.nome,
      cor: categoria.cor,
      distancia: categoria.distancia,
      subida: categoria.subida,
      tracado,
      pontos,
      trechos,
    };
  });

  const corrida = TRECHOS[0];

  return (
    <>
      {/* ─── Cabeçalho ───────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-limao/15 bg-petroleo-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between gap-3 px-5">
          {/* shrink-0 na logo: sem ele o flex espremia a assinatura do Clube
              para caber os âncoras, e no celular ela aparecia achatada, com
              as letras coladas. */}
          <Link href="/" className="flex shrink-0 items-center gap-4">
            <Image
              src="/logo-comercial.png"
              alt="Clube Comercial"
              width={326}
              height={80}
              priority
              className="h-9 w-auto shrink-0"
            />
            <span className="hidden h-8 w-px bg-white/15 sm:block" />
            <Image
              src="/logo-rdn.png"
              alt="Rachão da Noite"
              width={569}
              height={406}
              className="hidden h-9 w-auto shrink-0 sm:block"
            />
          </Link>

          <nav className="flex items-center gap-3.5 sm:gap-6">
            {/* Os âncoras internos só a partir do tablet. No celular eles
                disputavam espaço com a logo e, espremidos, faziam o dedo
                errar o alvo — quem mirava "Percurso" caía no GPX, e a
                página abria no meio. */}
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rotulo hidden text-[0.7rem] whitespace-nowrap text-neve-300 transition hover:text-white sm:inline"
              >
                {link.texto}
              </a>
            ))}
            <Link
              href="/#inscricao"
              className="rotulo shrink-0 rounded-lg bg-limao px-3.5 py-2.5 text-[0.7rem] text-petroleo-950 transition hover:bg-limao-claro"
            >
              Inscrever
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5">
        {/* ─── Capa ──────────────────────────────────────────────────────── */}
        <section className="pt-10 pb-8 lg:pt-14">
          <p className="rotulo text-xs text-limao">Percurso oficial</p>
          <h1 className="titulo mt-4 text-[clamp(2.5rem,7vw,4.5rem)] text-white">
            Conheça o trajeto
            <br />
            antes da largada
          </h1>
          <div className="mt-7 flex flex-wrap gap-3">
            <span className="rounded-full border border-petroleo-700 bg-petroleo-900 px-4 py-2 text-sm font-semibold">
              {EVENTO.diaSemana} · {EVENTO.dataCurta}
            </span>
            <span className="rounded-full border border-petroleo-700 bg-petroleo-900 px-4 py-2 text-sm font-semibold">
              Concentração {EVENTO.concentracao} · largada {EVENTO.largada}
            </span>
            <span className="rounded-full border border-petroleo-700 bg-petroleo-900 px-4 py-2 text-sm font-semibold">
              {EVENTO.local} · {EVENTO.sede}
            </span>
          </div>
        </section>
      </main>

      {/* ─── Faixa rolante ───────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="overflow-hidden border-y border-petroleo-800 bg-petroleo-900/60 py-3"
      >
        <div className="esteira">
          {[0, 1].map((copia) => (
            <div key={copia} className="flex shrink-0">
              {CATEGORIAS.concat(CATEGORIAS, CATEGORIAS).map((c, i) => (
                <span
                  key={`${copia}-${i}`}
                  className="titulo flex items-center gap-5 px-5 text-xl whitespace-nowrap text-neve-500"
                >
                  <span style={{ color: c.cor }}>{c.nome}</span>
                  {c.distancia}
                  <span className="text-limao/50">•</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-5">
        {/* ─── Percurso ──────────────────────────────────────────────────── */}
        <section id="percurso" className="scroll-mt-24 py-14 lg:py-20">
          <p className="rotulo text-xs text-limao">Os dois trajetos</p>
          <h2 className="titulo mt-3 text-[clamp(2rem,5vw,3.25rem)] text-white">
            Mesma largada, caminhos diferentes
          </h2>
          <p className="mt-5 max-w-[62ch] text-lg text-neve-300">
            Os dois percursos saem juntos do estacionamento da Arena e andam
            lado a lado nos primeiros 13,8 km, até o ponto de apoio. Dali o
            Cicloturismo retorna e o Rachão larga na parte disputada. No fim,
            todo mundo volta pelo mesmo caminho, no seu ritmo.
          </p>

          <div className="mt-9 grid gap-4 sm:grid-cols-2">
            {CATEGORIAS.map((categoria) => (
              <div
                key={categoria.id}
                className="flex overflow-hidden rounded-2xl border border-petroleo-700 bg-petroleo-900"
              >
                <span
                  aria-hidden="true"
                  className="w-2 shrink-0"
                  style={{ backgroundColor: categoria.cor }}
                />
                <div className="min-w-0 px-5 py-4">
                  <p className="rotulo text-[0.62rem] text-neve-500">
                    {categoria.apelido}
                  </p>
                  <h3
                    className="titulo text-3xl"
                    style={{ color: categoria.cor }}
                  >
                    {categoria.nome}
                  </h3>
                  <dl className="mt-2 flex flex-wrap gap-x-8 gap-y-3 tabular-nums">
                    {[
                      ["distância", categoria.distancia],
                      ["subida", categoria.subida],
                      ["altitude", categoria.altitude],
                    ].map(([rotulo, valor]) => (
                      <div key={rotulo}>
                        <dd className="text-xl font-bold text-white">{valor}</dd>
                        <dt className="rotulo text-[0.62rem] text-neve-500">
                          {rotulo}
                        </dt>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 rounded-xl border border-petroleo-700 bg-petroleo-900/50 px-5 py-4 text-sm text-neve-300">
            <strong className="text-white">O Pedal Kids não entra aqui.</strong>{" "}
            A prova das crianças é curta e fica dentro da área da Sede
            Campestre, sem sair para a estrada — por isso não tem GPX.
          </p>

          {/* Explorador: o mapa mostra onde passa, o gráfico mostra o que
              espera o ciclista em cada quilômetro. */}
          <div className="mt-12">
            <ExploradorPercurso categorias={tracados} />
          </div>

          <ul className="mt-10 grid gap-4">
            {REFERENCIAS.map((ponto) => (
              <li key={ponto.marca} className="flex items-start gap-4">
                <span
                  className={`titulo flex size-8 shrink-0 items-center justify-center rounded-full text-base text-petroleo-950 ${
                    ponto.marca === "L" ? "bg-white" : "bg-limao"
                  }`}
                >
                  {ponto.marca}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-white">{ponto.titulo}</p>
                  <p className="mt-0.5 text-sm text-neve-300">{ponto.detalhe}</p>
                  <p className="mt-1 font-mono text-xs text-neve-500 tabular-nums">
                    GPS {ponto.gps}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-6 max-w-[62ch] text-sm text-neve-500">
            Siga a sinalização da prova e as orientações do staff. O percurso
            pode sofrer ajustes de última hora por segurança.
          </p>
        </section>

        {/* ─── A corrida do Rachão ───────────────────────────────────────── */}
        <section
          id="corrida"
          className="scroll-mt-24 border-t border-petroleo-800 py-14 lg:py-20"
        >
          <p
            className="rotulo text-xs"
            style={{ color: corrida.cor }}
          >
            O trecho em amarelo
          </p>
          <h2 className="titulo mt-3 text-[clamp(2rem,5vw,3.25rem)] text-white">
            {corrida.extensao} de rachão de verdade
          </h2>
          <p className="mt-5 max-w-[62ch] text-lg text-neve-300">
            Quem está no percurso de 54,5 km faz a prova em três partes. A do
            meio é a que vale: sai do ponto de apoio no km 13,8 e volta a ele
            no km 40,6, e é esse pedaço que aparece em{" "}
            <span style={{ color: corrida.cor }}>amarelo</span> no mapa.
          </p>

          <ol className="mt-10 grid gap-5 lg:grid-cols-3">
            {[
              {
                fase: "Ida",
                km: "km 0 → 13,8",
                distancia: "13,8 km",
                cor: CATEGORIAS[0].cor,
                texto:
                  "Saída da Arena junto com o Cicloturismo, pela mesma estrada, até o ponto de apoio na bifurcação. Sem pressa: a prova ainda não começou.",
              },
              {
                fase: "A corrida",
                km: "km 13,8 → 40,6",
                distancia: corrida.extensao,
                cor: corrida.cor,
                texto:
                  "O pedaço que vale. Sai do ponto de apoio, dá a volta e chega de novo nele. Não há cronometragem: anota-se a ordem de chegada dos cinco primeiros, e é daí que saem os troféus.",
                destaque: true,
              },
              {
                fase: "Volta",
                km: "km 40,6 → 54,5",
                distancia: "13,9 km",
                cor: CATEGORIAS[0].cor,
                texto:
                  "Do apoio até o clube pelo caminho da ida, no ritmo de cada um. A disputa já acabou — é só voltar e encerrar o pedal.",
              },
            ].map((fase) => (
              <li
                key={fase.fase}
                className={`rounded-2xl border p-6 ${
                  fase.destaque
                    ? "border-2 bg-petroleo-900"
                    : "border-petroleo-700 bg-petroleo-900/50"
                }`}
                style={fase.destaque ? { borderColor: fase.cor } : undefined}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3
                    className="titulo text-2xl"
                    style={{ color: fase.cor }}
                  >
                    {fase.fase}
                  </h3>
                  <span className="rotulo text-[0.62rem] text-neve-500 tabular-nums">
                    {fase.km}
                  </span>
                </div>
                <p className="titulo mt-2 text-3xl text-white tabular-nums">
                  {fase.distancia}
                </p>
                <p className="mt-3 text-sm text-neve-300">{fase.texto}</p>
              </li>
            ))}
          </ol>

          <p className="mt-6 max-w-[62ch] text-sm text-neve-500">
            O ponto de apoio é o mesmo lugar nas duas passagens do Rachão e na
            única do Cicloturismo — no GPX, os quilômetros 13,8 e 40,6 caem a
            11 m um do outro.
          </p>
        </section>

        {/* ─── GPX ───────────────────────────────────────────────────────── */}
        <section
          id="gpx"
          className="scroll-mt-24 border-t border-petroleo-800 py-14 lg:py-20"
        >
          <p className="rotulo text-xs text-limao">Para o seu GPS</p>
          <h2 className="titulo mt-3 text-[clamp(2rem,5vw,3.25rem)] text-white">
            Baixe o arquivo da sua prova
          </h2>
          <p className="mt-5 max-w-[62ch] text-neve-300">
            Arquivo GPX, que entra direto no Garmin, no Wahoo, no Strava ou no
            aplicativo que você usa. Baixe antes de sair de casa: no dia, o
            sinal na estrada é fraco.
          </p>

          <div className="mt-9 grid gap-4 sm:grid-cols-2">
            {CATEGORIAS.map((categoria) => (
              <a
                key={categoria.id}
                href={`/percurso/${categoria.arquivo}`}
                download
                className="group flex items-center gap-4 rounded-2xl border border-petroleo-700 bg-petroleo-900 px-5 py-5 transition hover:border-limao"
              >
                <span
                  aria-hidden="true"
                  className="flex size-12 shrink-0 items-center justify-center rounded-xl text-petroleo-950"
                  style={{ backgroundColor: categoria.cor }}
                >
                  <IconeBaixar className="size-6" />
                </span>
                <span className="min-w-0">
                  <span className="titulo block text-2xl text-white">
                    {categoria.nome}
                  </span>
                  <span className="mt-0.5 block text-sm text-neve-300">
                    {categoria.distancia} · arquivo .gpx
                  </span>
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* ─── O evento ──────────────────────────────────────────────────── */}
        <section className="border-t border-petroleo-800 py-14 lg:py-20">
          <p className="rotulo text-xs text-limao">O evento</p>
          <h2 className="titulo mt-3 text-[clamp(2rem,5vw,3.25rem)] text-white">
            {EVENTO.nome}
          </h2>

          <dl className="mt-8 grid gap-x-10 gap-y-4 sm:grid-cols-[auto_1fr]">
            {[
              ["Data", `${EVENTO.data} (${EVENTO.diaSemana})`],
              [
                "Horários",
                `Concentração ${EVENTO.concentracao} · largada ${EVENTO.largada}`,
              ],
              [
                "Local",
                `${EVENTO.local} — ${EVENTO.sede}, ${EVENTO.cidade}/${EVENTO.estado}`,
              ],
              ["Percursos", "Rachão 54,5 km e Cicloturismo 27,6 km"],
              ["Inscrição", `${EVENTO.custo}, até ${EVENTO.prazoBrinquedo}`],
            ].map(([rotulo, valor]) => (
              <div key={rotulo} className="contents">
                <dt className="rotulo pt-1 text-[0.65rem] text-neve-500">
                  {rotulo}
                </dt>
                <dd className="font-semibold text-white">{valor}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-10 flex flex-col items-start gap-4 rounded-2xl border border-limao/40 bg-limao/5 p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-neve-300">
              <strong className="text-white">
                Inscrição aberta até {EVENTO.prazoBrinquedo}.
              </strong>{" "}
              A inscrição é um brinquedo, entregue em um dos quatro pontos de
              coleta. Sem ele, não tem largada.
            </p>
            <Link
              href="/#inscricao"
              className="inline-flex shrink-0 items-center gap-2.5 rounded-xl bg-limao px-6 py-3.5 font-bold text-petroleo-950 transition hover:bg-limao-claro"
            >
              Fazer minha inscrição
            </Link>
          </div>
        </section>
      </main>

      {/* ─── Rodapé ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-petroleo-800 py-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 text-sm text-neve-500">
          <span>
            Organização {EVENTO.promocao} · {EVENTO.cidade}/{EVENTO.estado}
          </span>
          <a
            href={GRUPO.convite}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-semibold text-limao transition hover:text-limao-claro"
          >
            <IconeWhatsapp className="size-4" />
            Grupo do ciclismo
          </a>
          {/* Fecha o ciclo: quem rolou a página inteira do percurso volta
              para a inscrição sem ter de subir até a barra do topo. */}
          <Link
            href="/"
            className="font-semibold text-white transition hover:text-limao"
          >
            Página da inscrição
          </Link>
          {CONTATOS.map((contato) => (
            <a
              key={contato.whatsapp}
              href={`https://wa.me/${contato.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-semibold text-limao transition hover:text-limao-claro"
            >
              <IconeWhatsapp className="size-4" />
              {contato.nome.split(" ")[0]}
            </a>
          ))}
          <span>Mapa: © colaboradores do OpenStreetMap</span>
        </div>
      </footer>
    </>
  );
}
