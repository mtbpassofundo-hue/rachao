"use client";

import { useMemo, useState } from "react";

import { CATEGORIAS, categoriaPorId } from "@/lib/evento";
import type { InscritoPublico } from "@/lib/supabase";

/**
 * Compara nomes ignorando acento e caixa: quem procura "Jose" tem de achar
 * "José". `localeCompare` resolveria a ordenação, mas aqui o que se quer é
 * conter, então o jeito é tirar os acentos dos dois lados.
 */
function semAcento(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function Lista({ inscritos }: { inscritos: InscritoPublico[] }) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todas");

  const visiveis = useMemo(() => {
    const termo = semAcento(busca.trim());
    return inscritos.filter((inscrito) => {
      if (filtro !== "todas" && inscrito.categoria !== filtro) return false;
      if (!termo) return true;
      return semAcento(inscrito.nome).includes(termo);
    });
  }, [inscritos, busca, filtro]);

  if (inscritos.length === 0) {
    return (
      <p className="rounded-2xl border border-petroleo-700 bg-petroleo-900/50 px-6 py-10 text-center text-neve-300">
        Ninguém inscrito ainda. Seja o primeiro.
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <input
          type="search"
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          placeholder="Procurar pelo nome"
          aria-label="Procurar pelo nome"
          className="campo sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {[{ id: "todas", nome: "Todas" }, ...CATEGORIAS].map((opcao) => (
            <button
              key={opcao.id}
              type="button"
              onClick={() => setFiltro(opcao.id)}
              aria-pressed={filtro === opcao.id}
              className={`rotulo rounded-lg border px-4 py-2.5 text-[0.7rem] transition ${
                filtro === opcao.id
                  ? "border-limao bg-limao text-petroleo-950"
                  : "border-petroleo-700 text-neve-300 hover:border-petroleo-600 hover:text-white"
              }`}
            >
              {opcao.nome}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-5 text-sm text-neve-500">
        {visiveis.length === inscritos.length
          ? `${inscritos.length} ${inscritos.length === 1 ? "inscrito" : "inscritos"}`
          : `${visiveis.length} de ${inscritos.length}`}
      </p>

      {visiveis.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-petroleo-700 bg-petroleo-900/50 px-6 py-10 text-center text-neve-300">
          Nenhum nome encontrado.
        </p>
      ) : (
        <ol className="mt-5 overflow-hidden rounded-2xl border border-petroleo-700">
          {visiveis.map((inscrito, i) => (
            <li
              key={`${inscrito.nome}-${inscrito.criado_em}`}
              className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1 border-b border-petroleo-800 bg-petroleo-900/50 px-5 py-3.5 last:border-b-0"
            >
              <span className="flex min-w-0 items-baseline gap-3">
                <span className="w-7 shrink-0 text-right text-sm text-neve-500">
                  {i + 1}
                </span>
                <span className="truncate font-semibold text-white">
                  {inscrito.nome}
                </span>
              </span>
              <span className="rotulo shrink-0 text-[0.65rem] text-limao">
                {categoriaPorId(inscrito.categoria)?.nome ?? inscrito.categoria}
              </span>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
