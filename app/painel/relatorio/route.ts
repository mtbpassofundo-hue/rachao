import { CATEGORIAS, categoriaPorId, pontoPorId } from "@/lib/evento";
import { montarXlsx, type Celula, type Coluna } from "@/lib/planilha";
import { sessaoValida } from "@/lib/sessao";
import { supabaseAdmin, type Inscricao } from "@/lib/supabase";
import { formatarCpf, formatarData, formatarWhatsapp, idadeNoEvento } from "@/lib/validacao";

const COLUNAS: Coluna[] = [
  { titulo: "#", largura: 5 },
  { titulo: "Nome completo", largura: 34 },
  { titulo: "Modalidade", largura: 15 },
  { titulo: "CPF", largura: 16 },
  { titulo: "Nascimento", largura: 12 },
  { titulo: "Idade na prova", largura: 14 },
  { titulo: "Cidade", largura: 20 },
  { titulo: "WhatsApp", largura: 17 },
  { titulo: "Ponto de coleta", largura: 34 },
  { titulo: "Brinquedo entregue", largura: 18 },
  { titulo: "Responsável", largura: 30 },
  { titulo: "CPF do responsável", largura: 18 },
  { titulo: "Termo aceito em", largura: 18 },
  { titulo: "Inscrição em", largura: 18 },
];

function dataHora(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

export async function GET() {
  if (!(await sessaoValida())) {
    return new Response("Entre no painel para baixar o relatório.", {
      status: 401,
    });
  }

  const { data, error } = await supabaseAdmin()
    .from("inscricoes_rachao")
    .select(
      "id, criado_em, nome, categoria, cpf, nascimento, cidade, whatsapp, ponto_coleta, responsavel_nome, responsavel_cpf, termo_aceito_em, brinquedo_entregue",
    )
    // No relatório a ordem útil é a da largada: modalidade e depois nome.
    .order("categoria", { ascending: true })
    .order("nome", { ascending: true });

  if (error) {
    console.error("Falha ao montar o relatório:", error);
    return new Response("Não foi possível montar o relatório agora.", {
      status: 500,
    });
  }

  const inscricoes = (data ?? []) as Inscricao[];

  // A ordem das categorias no arquivo segue a de lib/evento.ts, não a
  // alfabética que veio do banco.
  const ordem = new Map<string, number>(CATEGORIAS.map((c, i) => [c.id, i]));
  inscricoes.sort(
    (a, b) =>
      (ordem.get(a.categoria) ?? 99) - (ordem.get(b.categoria) ?? 99) ||
      a.nome.localeCompare(b.nome, "pt-BR"),
  );

  const linhas: Celula[][] = inscricoes.map((inscricao, i) => [
    i + 1,
    inscricao.nome,
    categoriaPorId(inscricao.categoria)?.nome ?? inscricao.categoria,
    formatarCpf(inscricao.cpf),
    formatarData(inscricao.nascimento),
    idadeNoEvento(inscricao.nascimento),
    inscricao.cidade,
    formatarWhatsapp(inscricao.whatsapp),
    pontoPorId(inscricao.ponto_coleta)?.nome ?? inscricao.ponto_coleta,
    inscricao.brinquedo_entregue ? "Sim" : "Não",
    inscricao.responsavel_nome ?? "",
    inscricao.responsavel_cpf ? formatarCpf(inscricao.responsavel_cpf) : "",
    dataHora(inscricao.termo_aceito_em),
    dataHora(inscricao.criado_em),
  ]);

  const arquivo = montarXlsx("Inscritos", COLUNAS, linhas);
  const hoje = new Date().toISOString().slice(0, 10);

  return new Response(new Uint8Array(arquivo), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="inscritos-rachao-bike-${hoje}.xlsx"`,
      // Relatório com CPF não pode ficar em cache de proxy nenhum.
      "Cache-Control": "no-store, max-age=0",
      "X-Robots-Tag": "noindex",
    },
  });
}
