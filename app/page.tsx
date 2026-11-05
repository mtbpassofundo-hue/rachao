import Image from "next/image";
import Link from "next/link";

import { FormularioInscricao } from "@/app/componentes/formulario-inscricao";
import { IconeWhatsapp } from "@/app/componentes/icone-whatsapp";
import {
  CATEGORIAS,
  CONTATOS,
  CONTATO_PRINCIPAL,
  EVENTO,
  GRUPO,
  PONTOS_COLETA,
} from "@/lib/evento";

const LINKS = [
  { href: "#causa", texto: "A causa" },
  { href: "#modalidades", texto: "Modalidades" },
  { href: "/percurso", texto: "Percurso" },
  { href: "#coleta", texto: "Pontos de coleta" },
  { href: "/inscritos", texto: "Inscritos" },
];

function Dado({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="rotulo text-[0.65rem] text-limao">{rotulo}</dt>
      <dd className="titulo mt-1.5 text-2xl text-white sm:text-3xl">
        {children}
      </dd>
    </div>
  );
}

export default function Pagina() {
  return (
    <>
      {/* ─── Cabeçalho ───────────────────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-limao/15 bg-petroleo-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-3 px-4 sm:gap-4 sm:px-5">
          <a href="#topo" className="flex shrink-0 items-center gap-4">
            <Image
              src="/logo-comercial.png"
              alt="Clube Comercial"
              width={326}
              height={80}
              priority
              className="h-8 w-auto shrink-0 sm:h-10"
            />
            <span className="hidden h-8 w-px bg-white/15 sm:block" />
            <Image
              src="/logo-rdn.png"
              alt="Rachão da Noite"
              width={569}
              height={406}
              priority
              className="hidden h-9 w-auto shrink-0 sm:block"
            />
            <span className="sr-only">
              {EVENTO.nome} — {EVENTO.promocao} com apoio do {EVENTO.apoio}
            </span>
          </a>

          <nav className="hidden items-center gap-7 lg:flex">
            {LINKS.map((link) =>
              link.href.startsWith("#") ? (
                <a
                  key={link.href}
                  href={link.href}
                  className="rotulo text-[0.7rem] text-neve-300 transition hover:text-white"
                >
                  {link.texto}
                </a>
              ) : (
                // Página de verdade, não âncora: com Link a troca é na hora,
                // sem recarregar o site inteiro.
                <Link
                  key={link.href}
                  href={link.href}
                  className="rotulo text-[0.7rem] text-neve-300 transition hover:text-white"
                >
                  {link.texto}
                </Link>
              ),
            )}
          </nav>

          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            {/* O percurso precisa de porta no topo também no celular: lá o
                menu some inteiro, e o único acesso ficava a quatro telas de
                rolagem. Some a partir do lg, onde o menu já traz o link. */}
            <Link
              href="/percurso"
              className="rotulo text-[0.65rem] whitespace-nowrap text-neve-300 transition hover:text-white sm:text-[0.7rem] lg:hidden"
            >
              Percurso
            </Link>
            <a
              href="#inscricao"
              className="rotulo shrink-0 rounded-lg bg-limao px-3 py-3 text-xs text-petroleo-950 transition hover:bg-limao-claro sm:px-5"
            >
              Inscrever
            </a>
          </div>
        </div>
      </header>

      <main id="topo">
        {/* ─── Capa ──────────────────────────────────────────────────────── */}
        <section className="relative isolate overflow-hidden pt-32 pb-16 lg:pt-40 lg:pb-24">
          <div aria-hidden="true" className="trama absolute inset-0 -z-20" />
          <div
            aria-hidden="true"
            className="absolute -top-48 -right-40 -z-10 h-[40rem] w-[40rem] rounded-full bg-limao/12 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-56 -left-48 -z-10 h-[34rem] w-[34rem] rounded-full bg-petroleo-600/35 blur-3xl"
          />

          <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 lg:grid-cols-[1fr_1.05fr]">
            <div className="min-w-0">
              <p className="rotulo inline-flex items-center gap-2.5 rounded-full border border-limao/40 bg-limao/10 px-4 py-2 text-[0.7rem] text-limao">
                <span className="size-1.5 rounded-full bg-limao" />
                {EVENTO.promocao} · apoio {EVENTO.apoio}
              </p>

              {/* A tarja limão do impresso, do jeito que ela aparece no flyer:
                  o nome do evento dentro do bloco de cor. */}
              <h1 className="titulo mt-7 text-[clamp(2.75rem,8vw,5.5rem)] text-white">
                Rachão
                <br />
                {/* A margem negativa cancela o respiro interno da tarja: sem
                    ela o "B" nasce recuado e não alinha com o "R" de cima. */}
                <span className="tarja mt-2 -ml-[0.55em] inline-block">
                  Bike 2026
                </span>
              </h1>

              <p className="mt-7 max-w-xl text-lg text-neve-300">
                O pedal do {EVENTO.promocao} volta em{" "}
                {EVENTO.edicao.toLowerCase()} — e este ano a inscrição não
                custa dinheiro.{" "}
                <strong className="text-white">
                  Custa um brinquedo, que vai para as mãos de uma criança.
                </strong>
              </p>

              <dl className="mt-9 grid grid-cols-2 gap-x-10 gap-y-6 border-t border-white/10 pt-7 sm:grid-cols-3">
                <Dado rotulo="Data">
                  {EVENTO.dataCurta}
                  <span className="block text-base text-neve-300 normal-case">
                    {EVENTO.diaSemana}
                  </span>
                </Dado>
                <Dado rotulo="Largada">
                  {EVENTO.largada}
                  <span className="block text-base text-neve-300 normal-case">
                    concentração {EVENTO.concentracao}
                  </span>
                </Dado>
                <Dado rotulo="Inscrição">
                  {EVENTO.custo}
                  <span className="block text-base text-neve-300 normal-case">
                    até {EVENTO.prazoBrinquedoCurto}
                  </span>
                </Dado>
              </dl>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#inscricao"
                  className="titulo rounded-xl bg-limao px-8 py-4 text-center text-2xl whitespace-nowrap text-petroleo-950 transition hover:bg-limao-claro"
                >
                  Quero me inscrever
                </a>
                <Link
                  href="/inscritos"
                  className="titulo rounded-xl border border-white/20 px-8 py-4 text-center text-2xl whitespace-nowrap text-white transition hover:border-limao hover:text-limao"
                >
                  Ver inscritos
                </Link>
              </div>

              <p className="mt-6 text-sm text-neve-300">
                {EVENTO.local} · {EVENTO.sede} · {EVENTO.cidade}/{EVENTO.estado}
              </p>
            </div>

            {/* No celular a foto vem antes do título: quase todo mundo chega
                por um link no WhatsApp, e a imagem diz do que se trata antes
                de a pessoa ler qualquer coisa. No computador ela volta para a
                direita, ao lado do texto. */}
            <div className="relative mx-auto -order-1 w-full min-w-0 lg:order-none">
              <div
                aria-hidden="true"
                className="absolute -inset-4 -z-10 rotate-2 rounded-3xl bg-gradient-to-br from-limao/30 via-petroleo-600/30 to-transparent blur-lg"
              />
              {/* A foto do ano passado é a capa do evento: adulto e criança no
                  mesmo quadro, que é o que o Rachão é. O flyer continua logo
                  abaixo, para quem quer a peça com todas as informações. */}
              <Image
                src="/fotos/largada.jpg"
                alt="Ciclistas e uma criança com suas bikes sob o pórtico de chegada, antes da largada do Rachão Bike"
                width={1600}
                height={1067}
                priority
                sizes="(max-width: 1024px) 92vw, 520px"
                className="w-full rounded-2xl border border-white/10 shadow-2xl shadow-black/60"
              />
              <p className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-neve-500">
                {/* Sem datar a foto: ela veio do acervo da organização e eu
                    não sei de qual edição é. */}
                <span>Na largada, as três provas saem do mesmo lugar</span>
                <a
                  href="/flyer.jpg"
                  download
                  className="font-semibold text-limao transition hover:text-limao-claro"
                >
                  Baixar o flyer
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* ─── Faixa rolante ─────────────────────────────────────────────── */}
        <div
          aria-hidden="true"
          className="overflow-hidden border-y border-limao/30 bg-limao py-3"
        >
          <div className="esteira">
            {[0, 1].map((copia) => (
              <div key={copia} className="flex shrink-0">
                {Array.from({ length: 6 }).map((_, i) => (
                  <span
                    key={i}
                    className="titulo flex items-center gap-5 px-5 text-xl whitespace-nowrap text-petroleo-950"
                  >
                    A inscrição é um brinquedo
                    <span className="text-petroleo-900/50">•</span>
                    {EVENTO.dataCurta}
                    <span className="text-petroleo-900/50">•</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ─── A causa ───────────────────────────────────────────────────── */}
        <section id="causa" className="mx-auto max-w-6xl px-5 py-24 lg:py-32">
          <div className="grid items-start gap-14 lg:grid-cols-2">
            <div>
              <p className="rotulo text-xs text-limao">A causa</p>
              <h2 className="titulo mt-4 text-[clamp(2.5rem,6vw,4.25rem)] text-white">
                Você pedala,
                <br />
                <span className="text-limao">uma criança ganha</span>
              </h2>

              <p className="mt-6 max-w-xl text-lg text-neve-300">
                Não há taxa, boleto nem lote. O que vale a vaga é um brinquedo
                em bom estado, entregue em um dos quatro pontos de coleta até{" "}
                <strong className="text-white">
                  {EVENTO.prazoBrinquedo}
                </strong>
                . Tudo que for arrecadado é doado a crianças carentes.
              </p>

              <ol className="mt-9 space-y-5">
                {[
                  [
                    "Preencha a inscrição",
                    "Leva menos de dois minutos. No fim da tela aparece o ponto que você escolheu.",
                  ],
                  [
                    `Leve o brinquedo até ${EVENTO.prazoBrinquedoCurto}`,
                    "Em qualquer um dos quatro pontos. Diga que é do Rachão Bike e dê seu nome.",
                  ],
                  [
                    "Apareça no domingo",
                    `Concentração ${EVENTO.concentracao}, largada ${EVENTO.largada}, no ${EVENTO.local.toLowerCase()}.`,
                  ],
                ].map(([titulo, texto], i) => (
                  <li key={titulo} className="flex gap-5">
                    <span className="titulo flex size-11 shrink-0 items-center justify-center rounded-xl bg-limao text-2xl text-petroleo-950">
                      {i + 1}
                    </span>
                    <span>
                      <strong className="block text-lg text-white">
                        {titulo}
                      </strong>
                      <span className="mt-1 block text-neve-300">{texto}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-3xl border border-limao/30 bg-limao/5 p-7 sm:p-9">
              <p className="rotulo text-xs text-limao">Sem brinquedo, sem vaga</p>
              <p className="titulo mt-4 text-3xl text-white sm:text-4xl">
                A inscrição só vale depois que o brinquedo chega
              </p>
              <p className="mt-5 text-neve-300">
                O formulário guarda seu nome na lista, mas a conferência é
                feita nos pontos de coleta. Quem não entregar até{" "}
                {EVENTO.prazoBrinquedoCurto} não larga — e a organização não
                tem como abrir exceção no dia, porque os brinquedos já terão
                sido separados para a doação.
              </p>
              <p className="mt-5 rounded-xl border border-white/10 bg-petroleo-950/50 px-5 py-4 text-sm text-neve-300">
                Brinquedo novo ou usado em bom estado, limpo e completo. Se
                tiver dúvida se o seu serve, chame o{" "}
                {CONTATO_PRINCIPAL.nome.split(" ")[0]}{" "}
                no WhatsApp antes de comprar.
              </p>

              <figure className="mt-7">
                <Image
                  src="/fotos/pelotao.jpg"
                  alt="Pelotão de ciclistas reunido na grama antes da largada"
                  width={1600}
                  height={1067}
                  sizes="(max-width: 1024px) 92vw, 460px"
                  className="w-full rounded-2xl border border-white/10"
                />
                <figcaption className="mt-2 text-xs text-neve-500">
                  A concentração, antes de soltar. Este ano, cada bike dessas
                  chega com um brinquedo já entregue.
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* ─── Modalidades ───────────────────────────────────────────────── */}
        <section
          id="modalidades"
          className="border-y border-white/5 bg-petroleo-900/40 py-24 lg:py-28"
        >
          <div className="mx-auto max-w-6xl px-5">
            <p className="rotulo text-xs text-limao">Modalidades</p>
            <h2 className="titulo mt-4 max-w-2xl text-[clamp(2.25rem,5vw,3.75rem)] text-white">
              Três jeitos de participar
            </h2>

            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {CATEGORIAS.map((categoria) => (
                <article
                  key={categoria.id}
                  className="flex flex-col rounded-2xl border border-petroleo-700 bg-petroleo-950/60 p-7"
                >
                  <p className="rotulo text-[0.65rem] text-limao">
                    {categoria.publico}
                  </p>
                  <h3 className="titulo mt-3 text-4xl text-white">
                    {categoria.nome}
                  </h3>
                  <p className="mt-4 flex-1 text-neve-300">
                    {categoria.descricao}
                  </p>
                  <p className="mt-6 border-t border-white/10 pt-5">
                    <span className="rotulo block text-[0.65rem] text-neve-500">
                      Premiação
                    </span>
                    <span className="mt-1.5 block font-bold text-limao">
                      {categoria.premiacao}
                    </span>
                  </p>
                </article>
              ))}
            </div>

            <p className="mt-8 rounded-xl border border-white/10 bg-petroleo-950/50 px-5 py-4 text-sm text-neve-300">
              <strong className="text-white">Menor de 18 anos?</strong> A
              inscrição pede o nome e o CPF de um responsável legal, que aceita
              o termo de autorização no próprio formulário. Vale para o Pedal
              Kids e para qualquer menor nas outras modalidades.
            </p>

            <div className="mt-6 flex flex-col items-start gap-4 rounded-2xl border border-petroleo-700 bg-petroleo-950/60 p-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-neve-300">
                <strong className="text-white">Onde a prova passa.</strong>{" "}
                Mapa das estradas, altimetria quilômetro a quilômetro e o GPX
                para o seu ciclocomputador — Rachão 54,5 km, com 26,8 km
                de disputa, e Cicloturismo 27,6 km.
              </p>
              <Link
                href="/percurso"
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 font-semibold text-white transition hover:border-limao hover:text-limao"
              >
                Ver o percurso
              </Link>
            </div>
          </div>
        </section>

        {/* ─── Pontos de coleta ──────────────────────────────────────────── */}
        <section id="coleta" className="mx-auto max-w-6xl px-5 py-24 lg:py-32">
          <p className="rotulo text-xs text-limao">Pontos de coleta</p>
          <h2 className="titulo mt-4 max-w-3xl text-[clamp(2.25rem,5vw,3.75rem)] text-white">
            Quatro lugares para deixar o brinquedo
          </h2>
          <p className="mt-5 max-w-2xl text-lg text-neve-300">
            Escolha o mais perto de você na hora da inscrição e entregue até{" "}
            {EVENTO.prazoBrinquedo}.
          </p>

          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {PONTOS_COLETA.map((ponto, i) => (
              <div
                key={ponto.id}
                className="flex items-start gap-5 rounded-2xl border border-petroleo-700 bg-petroleo-900/50 p-6"
              >
                <span className="titulo flex size-12 shrink-0 items-center justify-center rounded-xl border border-limao/40 bg-limao/10 text-2xl text-limao">
                  {i + 1}
                </span>
                <span>
                  <strong className="block text-lg text-white">
                    {ponto.nome}
                  </strong>
                  <span className="mt-1 block text-sm text-neve-300">
                    {ponto.tipo}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Formulário ────────────────────────────────────────────────── */}
        <section
          id="inscricao"
          className="border-t border-white/5 bg-petroleo-900/40 py-24 lg:py-32"
        >
          <div className="mx-auto max-w-3xl px-5">
            <div className="text-center">
              <p className="rotulo text-xs text-limao">Inscrição</p>
              <h2 className="titulo mt-4 text-[clamp(2.5rem,6vw,4.25rem)] text-white">
                Garanta sua vaga
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-neve-300">
                Uma inscrição por CPF, até {EVENTO.prazoBrinquedoCurto}.
                Preencha com os dados do documento — é com eles que a lista de
                largada é montada.
              </p>
            </div>

            <div className="mt-12">
              <FormularioInscricao />
            </div>
          </div>
        </section>

        {/* ─── Informações ───────────────────────────────────────────────── */}
        <section id="evento" className="mx-auto max-w-6xl px-5 py-24 lg:py-28">
          <div className="grid gap-14 lg:grid-cols-2">
            <div>
              <p className="rotulo text-xs text-limao">O evento</p>
              <h2 className="titulo mt-4 text-[clamp(2.25rem,5vw,3.5rem)] text-white">
                {EVENTO.nome}
              </h2>

              <dl className="mt-9 space-y-5">
                {[
                  ["Promoção", EVENTO.promocao],
                  ["Apoio", EVENTO.apoio],
                  ["Data", `${EVENTO.data} (${EVENTO.diaSemana})`],
                  [
                    "Horários",
                    `Concentração ${EVENTO.concentracao} · largada ${EVENTO.largada}`,
                  ],
                  [
                    "Local",
                    `${EVENTO.local} — ${EVENTO.sede}, ${EVENTO.cidade}/${EVENTO.estado}`,
                  ],
                  ["Percurso", EVENTO.percurso],
                  ["Inscrição", `${EVENTO.custo}, até ${EVENTO.prazoBrinquedo}`],
                ].map(([rotulo, valor]) => (
                  <div
                    key={rotulo}
                    className="flex flex-col gap-1 border-b border-white/10 pb-5 sm:flex-row sm:gap-8"
                  >
                    <dt className="rotulo w-32 shrink-0 pt-1 text-[0.65rem] text-neve-500">
                      {rotulo}
                    </dt>
                    <dd className="text-lg text-white">{valor}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-3xl border border-petroleo-700 bg-petroleo-900/50 p-7 sm:p-9">
              <p className="rotulo text-xs text-limao">Tire suas dúvidas</p>

              {/* O grupo vem primeiro e com o botão grande de propósito: lá os
                  próprios ciclistas respondem, e uma pergunta serve para os
                  outros vinte que iam perguntar o mesmo. Os telefones ficam
                  logo abaixo, para quem precisa falar direto. */}
              <p className="titulo mt-4 text-3xl text-white">
                Entre no grupo do ciclismo
              </p>
              <p className="mt-3 text-neve-300">
                É o melhor lugar para perguntar sobre percurso, brinquedo ou
                inscrição — a turma toda está lá e costuma responder antes da
                organização.
              </p>
              <a
                href={GRUPO.convite}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2.5 rounded-xl bg-limao px-6 py-3.5 font-bold text-petroleo-950 transition hover:bg-limao-claro"
              >
                <IconeWhatsapp className="size-5" />
                {GRUPO.nome}
              </a>

              <div className="mt-8 border-t border-white/10 pt-7">
                <p className="rotulo text-[0.65rem] text-neve-500">
                  Ou fale direto com a organização
                </p>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {CONTATOS.map((contato) => (
                    <li key={contato.whatsapp}>
                      <a
                        href={`https://wa.me/${contato.whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-full flex-col rounded-xl border border-petroleo-700 bg-petroleo-950/50 px-4 py-3 transition hover:border-limao"
                      >
                        <span className="font-bold text-white">
                          {contato.nome}
                        </span>
                        <span className="mt-0.5 text-xs text-neve-500">
                          {contato.papel}
                        </span>
                        <span className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-limao">
                          <IconeWhatsapp className="size-4" />
                          {contato.telefone}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-9 border-t border-white/10 pt-7">
                <p className="rotulo text-[0.65rem] text-neve-500">
                  Realização e apoio
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-8">
                  <Image
                    src="/logo-comercial.png"
                    alt="Clube Comercial"
                    width={326}
                    height={80}
                    className="h-11 w-auto"
                  />
                  <Image
                    src="/logo-rdn.png"
                    alt="Rachão da Noite"
                    width={569}
                    height={406}
                    className="h-14 w-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Rodapé ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Image
              src="/logo-comercial.png"
              alt="Clube Comercial"
              width={326}
              height={80}
              className="h-10 w-auto"
            />
            <p className="mt-4 max-w-sm text-sm text-neve-500">
              {EVENTO.nome} · {EVENTO.cidade}/{EVENTO.estado}. Os dados da
              inscrição ficam com a organização e são usados só para montar a
              largada e conferir a entrega dos brinquedos.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            <a
              href={GRUPO.convite}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-bold text-limao transition hover:text-limao-claro"
            >
              <IconeWhatsapp className="size-4" />
              Grupo {GRUPO.nome}
            </a>
            <Link
              href="/inscritos"
              className="text-sm font-bold text-limao transition hover:text-limao-claro"
            >
              Lista de inscritos
            </Link>
            {CONTATOS.map((contato) => (
              <a
                key={contato.whatsapp}
                href={`https://wa.me/${contato.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:text-limao"
              >
                <IconeWhatsapp className="size-4" />
                {contato.nome.split(" ")[0]} · {contato.telefone}
              </a>
            ))}
            <Link
              href="/painel"
              className="text-sm text-neve-500 transition hover:text-neve-300"
            >
              Painel da organização
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
