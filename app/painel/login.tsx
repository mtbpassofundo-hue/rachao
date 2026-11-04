"use client";

import { useActionState } from "react";

import { entrarPainel, type EstadoLogin } from "@/app/painel/acoes";
import { EVENTO } from "@/lib/evento";

const LOGIN_INICIAL: EstadoLogin = {};

export function Login() {
  const [estado, acao, entrando] = useActionState(entrarPainel, LOGIN_INICIAL);

  return (
    <form
      action={acao}
      className="w-full max-w-sm rounded-2xl border border-petroleo-700 bg-petroleo-900 p-8"
    >
      <h1 className="titulo text-3xl text-white">Painel da organização</h1>
      <p className="mt-2 text-sm text-neve-300">
        Inscrições do {EVENTO.nome} e relatório em Excel.
      </p>

      <label
        htmlFor="senha"
        className="rotulo mt-8 mb-2 block text-xs text-neve-300"
      >
        Senha
      </label>
      <input
        id="senha"
        name="senha"
        type="password"
        required
        autoFocus
        autoComplete="current-password"
        className="campo"
        aria-invalid={Boolean(estado.erro)}
        aria-describedby={estado.erro ? "erro-senha" : undefined}
      />

      {estado.erro && (
        <p id="erro-senha" role="alert" className="mt-2 text-sm text-alerta">
          {estado.erro}
        </p>
      )}

      <button
        type="submit"
        disabled={entrando}
        className="titulo mt-6 w-full rounded-xl bg-limao px-6 py-3.5 text-xl text-petroleo-950 transition hover:bg-limao-claro disabled:opacity-60"
      >
        {entrando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
