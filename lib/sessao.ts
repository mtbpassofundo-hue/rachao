import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import { segredoSessao, senhaPainel } from "@/lib/env";

const COOKIE = "rachao_painel";
const DURACAO_HORAS = 12;

function assinar(conteudo: string): string {
  return createHmac("sha256", segredoSessao()).update(conteudo).digest("hex");
}

/** Comparação de tempo constante — vale tanto para a senha quanto para a assinatura. */
function iguais(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function senhaConfere(tentativa: string): boolean {
  return iguais(tentativa, senhaPainel());
}

/**
 * O cookie carrega só a validade e a assinatura dela. Não guarda a senha, e
 * como é assinado com o segredo do servidor ninguém forja um do lado de fora.
 */
export async function abrirSessao(): Promise<void> {
  const expiraEm = Date.now() + DURACAO_HORAS * 60 * 60 * 1000;
  const conteudo = String(expiraEm);
  const loja = await cookies();
  loja.set(COOKIE, `${conteudo}.${assinar(conteudo)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACAO_HORAS * 60 * 60,
  });
}

export async function fecharSessao(): Promise<void> {
  const loja = await cookies();
  loja.delete(COOKIE);
}

export async function sessaoValida(): Promise<boolean> {
  const loja = await cookies();
  const bruto = loja.get(COOKIE)?.value;
  if (!bruto) return false;

  const separador = bruto.lastIndexOf(".");
  if (separador < 1) return false;

  const conteudo = bruto.slice(0, separador);
  const assinatura = bruto.slice(separador + 1);
  if (!iguais(assinatura, assinar(conteudo))) return false;

  const expiraEm = Number(conteudo);
  return Number.isFinite(expiraEm) && expiraEm > Date.now();
}
