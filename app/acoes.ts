"use server";

import { headers } from "next/headers";

import {
  CONTATO_PRINCIPAL,
  EVENTO,
  categoriaPorId,
  inscricoesEncerradas,
} from "@/lib/evento";
import { dentroDoLimite } from "@/lib/limite";
import { supabaseAdmin } from "@/lib/supabase";
import { esquemaInscricao, precisaResponsavel } from "@/lib/validacao";

// Só tipos e funções async podem sair de um arquivo "use server" — o estado
// inicial do formulário mora no próprio componente.
export type EstadoInscricao =
  | { estado: "inicial" }
  | { estado: "erro"; mensagem: string; campos: Record<string, string> }
  | { estado: "enviado"; primeiroNome: string; categoria: string; ponto: string };

async function ipDaRequisicao(): Promise<string> {
  const cabecalhos = await headers();
  const encaminhado = cabecalhos.get("x-forwarded-for");
  if (encaminhado) return encaminhado.split(",")[0].trim();
  return cabecalhos.get("x-real-ip") ?? "desconhecido";
}

export async function inscrever(
  _anterior: EstadoInscricao,
  dados: FormData,
): Promise<EstadoInscricao> {
  // A trava que vale é esta. A página é estática e pode estar aberta no
  // celular de alguém desde antes do prazo — esconder o formulário no
  // navegador não impede o envio, recusar aqui impede.
  if (inscricoesEncerradas()) {
    return {
      estado: "erro",
      mensagem: `As inscrições fecharam em ${EVENTO.prazoBrinquedoCurto}. Fale com ${CONTATO_PRINCIPAL.nome} no ${CONTATO_PRINCIPAL.telefone}.`,
      campos: {},
    };
  }

  const ip = await ipDaRequisicao();

  // Folgado de propósito. O freio existe para cortar dedo preso no botão e
  // script bobo, não para limitar gente de verdade: num mutirão no wi-fi da
  // Sede Campestre a turma toda sai pelo mesmo IP, e um teto baixo barraria
  // quem chegou por último. Quem protege contra inscrição repetida é a
  // unicidade do CPF, não isto.
  if (!dentroDoLimite(`inscricao:${ip}`, 25, 10 * 60 * 1000)) {
    return {
      estado: "erro",
      mensagem:
        "Muitos envios seguidos deste aparelho. Espere alguns minutos e tente de novo.",
      campos: {},
    };
  }

  const analise = esquemaInscricao.safeParse({
    nome: String(dados.get("nome") ?? ""),
    categoria: String(dados.get("categoria") ?? ""),
    cpf: String(dados.get("cpf") ?? ""),
    nascimento: String(dados.get("nascimento") ?? ""),
    cidade: String(dados.get("cidade") ?? ""),
    whatsapp: String(dados.get("whatsapp") ?? ""),
    pontoColeta: String(dados.get("pontoColeta") ?? ""),
    responsavelNome: String(dados.get("responsavelNome") ?? ""),
    responsavelCpf: String(dados.get("responsavelCpf") ?? ""),
    termo: dados.get("termo") === "sim",
    confirmacao: dados.get("confirmacao") === "sim",
  });

  if (!analise.success) {
    const campos: Record<string, string> = {};
    for (const problema of analise.error.issues) {
      const campo = String(problema.path[0] ?? "");
      if (campo && !campos[campo]) campos[campo] = problema.message;
    }
    return {
      estado: "erro",
      mensagem: "Confira os campos marcados abaixo.",
      campos,
    };
  }

  const inscricao = analise.data;
  const comResponsavel = precisaResponsavel(
    inscricao.categoria,
    inscricao.nascimento,
  );

  const { error } = await supabaseAdmin()
    .from("inscricoes_rachao")
    .insert({
      nome: inscricao.nome,
      categoria: inscricao.categoria,
      cpf: inscricao.cpf,
      nascimento: inscricao.nascimento,
      cidade: inscricao.cidade,
      whatsapp: inscricao.whatsapp,
      ponto_coleta: inscricao.pontoColeta,
      // Sem responsável, os três campos ficam nulos juntos: é o que o CHECK
      // do banco espera e o que mantém o relatório limpo.
      responsavel_nome: comResponsavel ? inscricao.responsavelNome : null,
      responsavel_cpf: comResponsavel ? inscricao.responsavelCpf : null,
      termo_aceito_em: comResponsavel ? new Date().toISOString() : null,
      origem_ip: ip,
    });

  if (error) {
    // 23505 = unique_violation, ou seja, esse CPF já está inscrito.
    if (error.code === "23505") {
      return {
        estado: "erro",
        mensagem:
          "Esse CPF já está inscrito. Uma inscrição por pessoa basta — confira na lista de inscritos.",
        campos: { cpf: "CPF já inscrito." },
      };
    }
    console.error("Falha ao gravar inscrição:", error);
    return {
      estado: "erro",
      mensagem:
        "Não conseguimos salvar sua inscrição agora. Tente de novo em instantes.",
      campos: {},
    };
  }

  return {
    estado: "enviado",
    primeiroNome: inscricao.nome.split(" ")[0],
    categoria: categoriaPorId(inscricao.categoria)?.nome ?? inscricao.categoria,
    ponto: inscricao.pontoColeta,
  };
}
