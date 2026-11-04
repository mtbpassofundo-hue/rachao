import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";

import { Lista } from "@/app/inscritos/lista";
import { CATEGORIAS, EVENTO } from "@/lib/evento";
import { supabaseAdmin, type InscritoPublico } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Inscritos",
  description: `Quem já está inscrito no ${EVENTO.nome}.`,
};

export default async function InscritosPagina() {
  // A lista muda a cada inscrição nova. Sem isto o Next pré-renderiza a página
  // no build e ela congela com os inscritos daquele momento.
  await connection();

  // Só nome, modalidade e data: CPF, telefone e endereço não saem do servidor
  // nem por engano, porque nem chegam a ser lidos.
  const { data, error } = await supabaseAdmin()
    .from("inscricoes_rachao")
    .select("nome, categoria, criado_em")
    .order("criado_em", { ascending: false });

  const inscritos = (data ?? []) as InscritoPublico[];

  const porCategoria = CATEGORIAS.map((categoria) => ({
    ...categoria,
    total: inscritos.filter((i) => i.categoria === categoria.id).length,
  }));

  return (
    <>
      <header className="border-b border-limao/15 bg-petroleo-950/90">
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between gap-4 px-5">
          <Link href="/" className="flex items-center gap-4">
            <Image
              src="/logo-comercial.png"
              alt="Clube Comercial"
              width={326}
              height={80}
              priority
              className="h-9 w-auto"
            />
            <span className="hidden h-8 w-px bg-white/15 sm:block" />
            <Image
              src="/logo-rdn.png"
              alt="Rachão da Noite"
              width={569}
              height={406}
              className="hidden h-9 w-auto sm:block"
            />
          </Link>
          <Link
            href="/#inscricao"
            className="rotulo shrink-0 rounded-lg bg-limao px-4 py-3 text-xs text-petroleo-950 transition hover:bg-limao-claro"
          >
            Inscrever
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-14 lg:py-20">
        <p className="rotulo text-xs text-limao">{EVENTO.nome}</p>
        <h1 className="titulo mt-4 text-[clamp(2.5rem,7vw,4.5rem)] text-white">
          Quem já está dentro
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-neve-300">
          Lista pública com nome e modalidade. Ela não diz se o brinquedo já foi
          entregue — isso é conferido nos pontos de coleta até{" "}
          {EVENTO.prazoBrinquedoCurto}.
        </p>

        {error ? (
          <p className="mt-12 rounded-2xl border border-alerta/40 bg-alerta/10 px-5 py-4 text-neve-100">
            Não foi possível carregar a lista agora. Recarregue a página em
            alguns instantes.
          </p>
        ) : (
          <>
            <dl className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-limao/40 bg-limao/10 p-5">
                <dt className="rotulo text-[0.65rem] text-limao">Total</dt>
                <dd className="titulo mt-1.5 text-4xl text-white">
                  {inscritos.length}
                </dd>
              </div>
              {porCategoria.map((categoria) => (
                <div
                  key={categoria.id}
                  className="rounded-2xl border border-petroleo-700 bg-petroleo-900/50 p-5"
                >
                  <dt className="rotulo text-[0.65rem] text-neve-500">
                    {categoria.nome}
                  </dt>
                  <dd className="titulo mt-1.5 text-4xl text-white">
                    {categoria.total}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-12">
              <Lista inscritos={inscritos} />
            </div>
          </>
        )}

        <p className="mt-14 border-t border-white/10 pt-8 text-sm text-neve-500">
          Não achou seu nome? Confira se a inscrição foi concluída ou fale com{" "}
          {EVENTO.coordenador}, {EVENTO.telefone}.
        </p>
      </main>
    </>
  );
}
