"use client";

import { useActionState, useId, useState, useSyncExternalStore } from "react";

import { inscrever, type EstadoInscricao } from "@/app/acoes";
import {
  CATEGORIAS,
  CATEGORIA_INFANTIL,
  EVENTO,
  PONTOS_COLETA,
  TERMO_MENOR,
  inscricoesEncerradas,
  pontoPorId,
} from "@/lib/evento";
import {
  formatarCpf,
  formatarWhatsapp,
  precisaResponsavel,
} from "@/lib/validacao";

const ESTADO_INICIAL: EstadoInscricao = { estado: "inicial" };

function Erro({ id, texto }: { id: string; texto?: string }) {
  if (!texto) return null;
  return (
    <p id={id} className="mt-1.5 text-sm font-medium text-alerta">
      {texto}
    </p>
  );
}

export function FormularioInscricao() {
  const [estado, acao, enviando] = useActionState(inscrever, ESTADO_INICIAL);
  const [categoria, setCategoria] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [cpf, setCpf] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cpfResponsavel, setCpfResponsavel] = useState("");
  const base = useId();

  // A página é gerada uma vez e servida a todo mundo, então quem decide se o
  // prazo virou é o relógio de quem está lendo. O relógio é um sistema externo
  // ao React: lemos com useSyncExternalStore, conferindo de minuto em minuto
  // para o formulário fechar sozinho em quem deixou a aba aberta na virada.
  // No HTML gerado o valor é sempre "aberto" — é o que evita o descompasso
  // entre servidor e navegador na hidratação.
  const encerrado = useSyncExternalStore(
    (aoMudar) => {
      const relogio = setInterval(aoMudar, 60_000);
      return () => clearInterval(relogio);
    },
    () => inscricoesEncerradas(),
    () => false,
  );

  const erros = estado.estado === "erro" ? estado.campos : {};
  const infantil = categoria === CATEGORIA_INFANTIL;
  const comResponsavel = precisaResponsavel(categoria, nascimento);

  if (encerrado && estado.estado !== "enviado") {
    return (
      <div className="rounded-2xl border border-petroleo-700 bg-petroleo-900/80 p-8 text-center sm:p-10">
        <h3 className="titulo text-3xl text-white sm:text-4xl">
          Inscrições encerradas
        </h3>
        <p className="mx-auto mt-4 max-w-lg text-neve-300">
          As inscrições do {EVENTO.nome} foram até{" "}
          {EVENTO.prazoBrinquedoCurto}, junto com o prazo de entrega do
          brinquedo. Se você entregou o brinquedo e não conseguiu se inscrever,
          fale com {EVENTO.coordenador}.
        </p>
        <a
          href={`https://wa.me/${EVENTO.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-7 inline-flex items-center gap-2.5 rounded-xl bg-limao px-7 py-3.5 font-bold text-petroleo-950 transition hover:bg-limao-claro"
        >
          Falar com {EVENTO.coordenador.split(" ")[0]}
        </a>
      </div>
    );
  }

  if (estado.estado === "enviado") {
    const ponto = pontoPorId(estado.ponto);
    return (
      <div className="rounded-2xl border border-limao/40 bg-limao/5 p-8 text-center sm:p-10">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-limao text-petroleo-950">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-8"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>

        <h3 className="titulo mt-6 text-3xl text-white sm:text-4xl">
          Inscrição feita, {estado.primeiroNome}!
        </h3>

        <p className="mx-auto mt-4 max-w-lg text-neve-300">
          Você está no <strong className="text-white">{estado.categoria}</strong>
          . Falta a parte que vale a inscrição:
        </p>

        {/* O ponto escolhido vem em destaque porque é a única coisa que a
            pessoa precisa lembrar depois de fechar esta tela. */}
        <div className="mx-auto mt-6 max-w-md rounded-2xl border border-limao/40 bg-petroleo-950/60 p-6">
          <p className="rotulo text-[0.65rem] text-limao">
            Leve o brinquedo até {EVENTO.prazoBrinquedoCurto}
          </p>
          <p className="titulo mt-2 text-2xl text-white">
            {ponto?.nome ?? "Ponto de coleta escolhido"}
          </p>
          <p className="mt-2 text-sm text-neve-300">
            Sem o brinquedo entregue a inscrição não é validada.
          </p>
        </div>

        <p className="mx-auto mt-6 max-w-lg text-sm text-neve-300">
          Dúvidas: {EVENTO.coordenador}, {EVENTO.telefone}.
        </p>

        <a
          href="/inscritos"
          className="mt-7 inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 font-semibold text-white transition hover:border-limao hover:text-limao"
        >
          Ver a lista de inscritos
        </a>
      </div>
    );
  }

  return (
    <form
      action={acao}
      noValidate
      className="rounded-2xl border border-petroleo-700 bg-petroleo-900/80 p-6 shadow-2xl shadow-black/40 sm:p-8"
    >
      {estado.estado === "erro" && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-alerta/50 bg-alerta/10 px-4 py-3 text-sm font-medium text-white"
        >
          {estado.mensagem}
        </div>
      )}

      {/* ─── Modalidade ─────────────────────────────────────────────────── */}
      <fieldset>
        <legend className="rotulo mb-3 text-xs text-neve-300">
          Escolha a modalidade
        </legend>
        <div className="grid gap-3">
          {CATEGORIAS.map((item) => (
            <label key={item.id} className="escolha" htmlFor={`${base}-${item.id}`}>
              <input
                id={`${base}-${item.id}`}
                type="radio"
                name="categoria"
                value={item.id}
                checked={categoria === item.id}
                onChange={() => setCategoria(item.id)}
                className="sr-only"
              />
              <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="titulo text-2xl text-white">{item.nome}</span>
                <span className="rotulo text-[0.65rem] text-limao">
                  {item.publico}
                </span>
              </span>
              <span className="mt-2 block text-sm text-neve-300">
                {item.descricao}
              </span>
              <span className="mt-2 block text-sm font-semibold text-white">
                {item.premiacao}
              </span>
            </label>
          ))}
        </div>
        <Erro id={`${base}-erro-categoria`} texto={erros.categoria} />
      </fieldset>

      {/* ─── Dados de quem pedala ───────────────────────────────────────── */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label
            htmlFor={`${base}-nome`}
            className="rotulo mb-2 block text-xs text-neve-300"
          >
            {infantil ? "Nome completo da criança" : "Nome completo"}
          </label>
          <input
            id={`${base}-nome`}
            name="nome"
            type="text"
            required
            autoComplete="name"
            maxLength={80}
            placeholder="Como está no documento"
            className="campo"
            aria-invalid={Boolean(erros.nome)}
            aria-describedby={erros.nome ? `${base}-erro-nome` : undefined}
          />
          <Erro id={`${base}-erro-nome`} texto={erros.nome} />
        </div>

        <div>
          <label
            htmlFor={`${base}-nascimento`}
            className="rotulo mb-2 block text-xs text-neve-300"
          >
            {infantil ? "Nascimento da criança" : "Data de nascimento"}
          </label>
          <input
            id={`${base}-nascimento`}
            name="nascimento"
            type="date"
            required
            min="1920-01-01"
            max={EVENTO.dataIso}
            autoComplete="bday"
            value={nascimento}
            onChange={(evento) => setNascimento(evento.target.value)}
            className="campo"
            aria-invalid={Boolean(erros.nascimento)}
            aria-describedby={
              erros.nascimento ? `${base}-erro-nascimento` : undefined
            }
          />
          <Erro id={`${base}-erro-nascimento`} texto={erros.nascimento} />
        </div>

        <div>
          <label
            htmlFor={`${base}-cpf`}
            className="rotulo mb-2 block text-xs text-neve-300"
          >
            {infantil ? "CPF da criança" : "CPF"}
          </label>
          <input
            id={`${base}-cpf`}
            name="cpf"
            type="text"
            required
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(evento) => setCpf(formatarCpf(evento.target.value))}
            className="campo"
            aria-invalid={Boolean(erros.cpf)}
            aria-describedby={erros.cpf ? `${base}-erro-cpf` : undefined}
          />
          <Erro id={`${base}-erro-cpf`} texto={erros.cpf} />
        </div>

        <div>
          <label
            htmlFor={`${base}-cidade`}
            className="rotulo mb-2 block text-xs text-neve-300"
          >
            Cidade
          </label>
          <input
            id={`${base}-cidade`}
            name="cidade"
            type="text"
            required
            maxLength={60}
            autoComplete="address-level2"
            placeholder="Passo Fundo"
            className="campo"
            aria-invalid={Boolean(erros.cidade)}
            aria-describedby={erros.cidade ? `${base}-erro-cidade` : undefined}
          />
          <Erro id={`${base}-erro-cidade`} texto={erros.cidade} />
        </div>

        <div>
          <label
            htmlFor={`${base}-whatsapp`}
            className="rotulo mb-2 block text-xs text-neve-300"
          >
            WhatsApp com DDD
          </label>
          <input
            id={`${base}-whatsapp`}
            name="whatsapp"
            type="tel"
            required
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="(54) 99999-9999"
            value={whatsapp}
            onChange={(evento) =>
              setWhatsapp(formatarWhatsapp(evento.target.value))
            }
            className="campo"
            aria-invalid={Boolean(erros.whatsapp)}
            aria-describedby={
              erros.whatsapp ? `${base}-erro-whatsapp` : undefined
            }
          />
          <Erro id={`${base}-erro-whatsapp`} texto={erros.whatsapp} />
        </div>
      </div>

      {/* ─── Responsável e termo ────────────────────────────────────────────
          Aparece no Pedal Kids e também quando a data de nascimento diz que
          quem larga ainda não tem 18 anos no dia da prova. */}
      {comResponsavel && (
        <div className="mt-8 rounded-2xl border border-limao/30 bg-limao/5 p-5 sm:p-6">
          <p className="rotulo text-xs text-limao">Responsável pelo menor</p>
          <p className="mt-2 text-sm text-neve-300">
            {infantil
              ? "Toda inscrição no Pedal Kids precisa de um responsável legal."
              : "Pela data de nascimento, quem vai largar é menor de 18 anos no dia da prova — a inscrição precisa de um responsável legal."}
          </p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor={`${base}-resp-nome`}
                className="rotulo mb-2 block text-xs text-neve-300"
              >
                Nome completo do responsável
              </label>
              <input
                id={`${base}-resp-nome`}
                name="responsavelNome"
                type="text"
                maxLength={80}
                placeholder="Pai, mãe ou responsável legal"
                className="campo"
                aria-invalid={Boolean(erros.responsavelNome)}
                aria-describedby={
                  erros.responsavelNome ? `${base}-erro-resp-nome` : undefined
                }
              />
              <Erro
                id={`${base}-erro-resp-nome`}
                texto={erros.responsavelNome}
              />
            </div>

            <div>
              <label
                htmlFor={`${base}-resp-cpf`}
                className="rotulo mb-2 block text-xs text-neve-300"
              >
                CPF do responsável
              </label>
              <input
                id={`${base}-resp-cpf`}
                name="responsavelCpf"
                type="text"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={cpfResponsavel}
                onChange={(evento) =>
                  setCpfResponsavel(formatarCpf(evento.target.value))
                }
                className="campo"
                aria-invalid={Boolean(erros.responsavelCpf)}
                aria-describedby={
                  erros.responsavelCpf ? `${base}-erro-resp-cpf` : undefined
                }
              />
              <Erro id={`${base}-erro-resp-cpf`} texto={erros.responsavelCpf} />
            </div>
          </div>

          <ul className="mt-6 space-y-2.5 border-t border-limao/20 pt-5 text-sm text-neve-300">
            {TERMO_MENOR.map((linha) => (
              <li key={linha} className="flex gap-2.5">
                <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-limao" />
                <span>{linha}</span>
              </li>
            ))}
          </ul>

          <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm font-semibold text-white">
            <input
              type="checkbox"
              name="termo"
              value="sim"
              className="mt-0.5 size-5 shrink-0 accent-[var(--color-limao)]"
              aria-invalid={Boolean(erros.termo)}
            />
            <span>Li e aceito o termo acima, como responsável legal.</span>
          </label>
          <Erro id={`${base}-erro-termo`} texto={erros.termo} />
        </div>
      )}

      {/* ─── Ponto de coleta ────────────────────────────────────────────── */}
      <fieldset className="mt-8">
        <legend className="rotulo mb-2 text-xs text-neve-300">
          Onde você vai deixar o brinquedo
        </legend>
        <p className="mb-3 text-sm text-neve-300">
          Escolha um dos quatro pontos e entregue até{" "}
          <strong className="text-limao">{EVENTO.prazoBrinquedoCurto}</strong>.
          É o brinquedo que vale a inscrição.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {PONTOS_COLETA.map((ponto) => (
            <label key={ponto.id} className="escolha" htmlFor={`${base}-${ponto.id}`}>
              <input
                id={`${base}-${ponto.id}`}
                type="radio"
                name="pontoColeta"
                value={ponto.id}
                className="sr-only"
              />
              <span className="block font-bold text-white">{ponto.nome}</span>
              <span className="mt-1 block text-sm text-neve-300">
                {ponto.tipo}
              </span>
            </label>
          ))}
        </div>
        <Erro id={`${base}-erro-ponto`} texto={erros.pontoColeta} />
      </fieldset>

      {/* ─── Confirmação ────────────────────────────────────────────────── */}
      <div className="mt-8">
        <label className="flex cursor-pointer items-start gap-3 text-sm text-neve-300">
          <input
            type="checkbox"
            name="confirmacao"
            value="sim"
            className="mt-0.5 size-5 shrink-0 accent-[var(--color-limao)]"
            aria-invalid={Boolean(erros.confirmacao)}
          />
          <span>
            Confirmo que os dados são verdadeiros e que estou em condições de
            saúde para a atividade. Autorizo o uso destes dados pela organização
            apenas para a realização do {EVENTO.nome}.
          </span>
        </label>
        <Erro id={`${base}-erro-confirmacao`} texto={erros.confirmacao} />
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="titulo mt-8 w-full rounded-xl bg-limao px-8 py-4 text-2xl text-petroleo-950 transition hover:bg-limao-claro disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enviando ? "Enviando…" : "Garantir minha vaga"}
      </button>

      <p className="mt-4 text-center text-xs text-neve-500">
        Uma inscrição por CPF. Seus dados ficam com a organização do{" "}
        {EVENTO.promocao} e não são divulgados — a lista pública mostra só nome
        e modalidade.
      </p>
    </form>
  );
}
