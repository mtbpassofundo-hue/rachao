"use client";

import { useMemo, useState, useTransition } from "react";

import { marcarBrinquedo, sairPainel } from "@/app/painel/acoes";
import { CATEGORIAS, categoriaPorId, pontoPorId } from "@/lib/evento";
import type { Inscricao } from "@/lib/supabase";
import {
  formatarCpf,
  formatarData,
  formatarWhatsapp,
  idadeNoEvento,
  somenteDigitos,
} from "@/lib/validacao";

function dataHoraLocal(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function semAcento(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function Contador({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: number;
  destaque?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        destaque
          ? "border-limao/40 bg-limao/10"
          : "border-petroleo-700 bg-petroleo-900/50"
      }`}
    >
      <p
        className={`rotulo text-[0.65rem] ${destaque ? "text-limao" : "text-neve-500"}`}
      >
        {rotulo}
      </p>
      <p className="titulo mt-1 text-3xl text-white">{valor}</p>
    </div>
  );
}

export function Tabela({ inscricoes }: { inscricoes: Inscricao[] }) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todas");
  const [somentePendentes, setSomentePendentes] = useState(false);
  const [salvando, iniciarTransicao] = useTransition();

  const filtradas = useMemo(() => {
    const termo = semAcento(busca.trim());
    const digitos = somenteDigitos(busca);
    return inscricoes.filter((inscricao) => {
      if (filtro !== "todas" && inscricao.categoria !== filtro) return false;
      if (somentePendentes && inscricao.brinquedo_entregue) return false;
      if (!termo) return true;
      return (
        semAcento(inscricao.nome).includes(termo) ||
        semAcento(inscricao.cidade).includes(termo) ||
        semAcento(inscricao.responsavel_nome ?? "").includes(termo) ||
        (digitos.length > 2 &&
          (inscricao.cpf.includes(digitos) ||
            inscricao.whatsapp.includes(digitos)))
      );
    });
  }, [inscricoes, busca, filtro, somentePendentes]);

  const entregues = inscricoes.filter((i) => i.brinquedo_entregue).length;

  function alternar(inscricao: Inscricao) {
    iniciarTransicao(async () => {
      const { erro } = await marcarBrinquedo(
        inscricao.id,
        !inscricao.brinquedo_entregue,
      );
      if (erro) window.alert(erro);
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element -- o painel é
              uma tela interna; não vale ligar o otimizador por um logo. */}
          <img
            src="/logo-comercial.png"
            alt="Clube Comercial"
            className="mb-5 h-9 w-auto"
          />
          <h1 className="titulo text-4xl text-white">Inscrições</h1>
          <p className="mt-2 text-neve-300">
            {inscricoes.length}{" "}
            {inscricoes.length === 1 ? "inscrição" : "inscrições"}
            {filtradas.length !== inscricoes.length &&
              ` · ${filtradas.length} na busca`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/painel/relatorio"
            className="rounded-lg bg-limao px-4 py-2.5 text-sm font-bold text-petroleo-950 transition hover:bg-limao-claro"
          >
            Baixar Excel
          </a>
          <form action={sairPainel}>
            <button
              type="submit"
              className="rounded-lg px-4 py-2.5 text-sm text-neve-500 transition hover:text-white"
            >
              Sair
            </button>
          </form>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Contador rotulo="Total" valor={inscricoes.length} destaque />
        {CATEGORIAS.map((categoria) => (
          <Contador
            key={categoria.id}
            rotulo={categoria.nome}
            valor={inscricoes.filter((i) => i.categoria === categoria.id).length}
          />
        ))}
        <Contador rotulo="Brinquedos entregues" valor={entregues} />
      </div>

      <div className="mt-7 flex flex-col gap-4 lg:flex-row lg:items-center">
        <input
          type="search"
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          placeholder="Nome, cidade, responsável, CPF ou WhatsApp"
          aria-label="Buscar inscrições"
          className="campo lg:max-w-sm"
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
          <button
            type="button"
            onClick={() => setSomentePendentes((v) => !v)}
            aria-pressed={somentePendentes}
            className={`rotulo rounded-lg border px-4 py-2.5 text-[0.7rem] transition ${
              somentePendentes
                ? "border-alerta bg-alerta text-white"
                : "border-petroleo-700 text-neve-300 hover:border-petroleo-600 hover:text-white"
            }`}
          >
            Sem brinquedo
          </button>
        </div>
      </div>

      {inscricoes.length === 0 ? (
        <p className="mt-16 text-center text-neve-500">
          Nenhuma inscrição ainda. Assim que alguém preencher o formulário,
          aparece aqui.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-petroleo-800">
          <table className="w-full min-w-[72rem] border-collapse text-sm">
            <thead>
              <tr className="bg-petroleo-900 text-left">
                {[
                  "#",
                  "Brinquedo",
                  "Nome",
                  "Modalidade",
                  "Idade",
                  "CPF",
                  "Cidade",
                  "WhatsApp",
                  "Ponto de coleta",
                  "Responsável",
                  "Inscrição",
                ].map((coluna) => (
                  <th
                    key={coluna}
                    scope="col"
                    className="rotulo px-4 py-3.5 text-[0.65rem] whitespace-nowrap text-neve-300"
                  >
                    {coluna}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtradas.map((inscricao, indice) => (
                <tr
                  key={inscricao.id}
                  className="border-t border-petroleo-800 transition hover:bg-petroleo-900/60"
                >
                  <td className="px-4 py-3.5 text-neve-500 tabular-nums">
                    {indice + 1}
                  </td>
                  <td className="px-4 py-3.5">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={inscricao.brinquedo_entregue}
                        disabled={salvando}
                        onChange={() => alternar(inscricao)}
                        className="size-5 accent-[var(--color-limao)]"
                        aria-label={`Brinquedo de ${inscricao.nome}`}
                      />
                      <span
                        className={
                          inscricao.brinquedo_entregue
                            ? "text-xs font-bold text-limao"
                            : "text-xs text-neve-500"
                        }
                      >
                        {inscricao.brinquedo_entregue ? "Entregue" : "Pendente"}
                      </span>
                    </label>
                  </td>
                  <td className="px-4 py-3.5 font-medium whitespace-nowrap text-white">
                    {inscricao.nome}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="rounded-md bg-limao/15 px-2 py-1 text-xs font-semibold text-limao">
                      {categoriaPorId(inscricao.categoria)?.nome ??
                        inscricao.categoria}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-neve-300 tabular-nums">
                    {idadeNoEvento(inscricao.nascimento)}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-neve-300 tabular-nums">
                    {formatarCpf(inscricao.cpf)}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-neve-300">
                    {inscricao.cidade}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap tabular-nums">
                    <a
                      href={`https://wa.me/55${inscricao.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-limao transition hover:underline"
                    >
                      {formatarWhatsapp(inscricao.whatsapp)}
                    </a>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-neve-300">
                    {pontoPorId(inscricao.ponto_coleta)?.nome ??
                      inscricao.ponto_coleta}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-neve-300">
                    {inscricao.responsavel_nome ? (
                      <span>
                        {inscricao.responsavel_nome}
                        <span className="block text-xs text-neve-500 tabular-nums">
                          {formatarCpf(inscricao.responsavel_cpf ?? "")} · termo
                          aceito
                        </span>
                      </span>
                    ) : (
                      <span className="text-neve-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-neve-500 tabular-nums">
                    <span>{dataHoraLocal(inscricao.criado_em)}</span>
                    <span className="block text-xs">
                      nasc. {formatarData(inscricao.nascimento)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtradas.length === 0 && (
            <p className="px-4 py-10 text-center text-neve-500">
              Nada encontrado com esses filtros.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
