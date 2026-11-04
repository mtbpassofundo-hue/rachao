"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { dentroDoLimite } from "@/lib/limite";
import { abrirSessao, fecharSessao, senhaConfere, sessaoValida } from "@/lib/sessao";
import { supabaseAdmin } from "@/lib/supabase";

export type EstadoLogin = { erro?: string };

export async function entrarPainel(
  _anterior: EstadoLogin,
  dados: FormData,
): Promise<EstadoLogin> {
  const cabecalhos = await headers();
  const ip =
    cabecalhos.get("x-forwarded-for")?.split(",")[0].trim() ??
    cabecalhos.get("x-real-ip") ??
    "desconhecido";

  if (!dentroDoLimite(`painel:${ip}`, 8, 15 * 60 * 1000)) {
    return { erro: "Tentativas demais. Espere 15 minutos." };
  }

  const senha = String(dados.get("senha") ?? "");
  if (!senhaConfere(senha)) {
    return { erro: "Senha incorreta." };
  }

  await abrirSessao();
  redirect("/painel");
}

export async function sairPainel(): Promise<void> {
  await fecharSessao();
  redirect("/painel");
}

/**
 * Marca (ou desmarca) que o brinquedo daquela inscrição chegou ao ponto de
 * coleta. É o que separa "se inscreveu" de "pode largar".
 *
 * A sessão é conferida aqui dentro: Server Action é um endereço público como
 * qualquer outro, e quem souber o nome da função pode chamá-la sem passar
 * pela tela.
 */
export async function marcarBrinquedo(
  id: string,
  entregue: boolean,
): Promise<{ erro?: string }> {
  if (!(await sessaoValida())) return { erro: "Sessão expirada." };

  const { error } = await supabaseAdmin()
    .from("inscricoes_rachao")
    .update({ brinquedo_entregue: entregue })
    .eq("id", id);

  if (error) {
    console.error("Falha ao marcar brinquedo:", error);
    return { erro: "Não foi possível salvar agora." };
  }

  revalidatePath("/painel");
  return {};
}
