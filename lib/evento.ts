/**
 * Tudo que é dado do Rachão Bike 2026 mora aqui. Mudou a data, o horário, um
 * ponto de coleta ou o telefone do coordenador, muda neste arquivo e o site
 * inteiro acompanha.
 */

export const EVENTO = {
  nome: "Rachão Bike 2026",
  edicao: "2ª edição",
  promocao: "Clube Comercial",
  apoio: "Rachão da Noite (RDN)",

  data: "29 de novembro de 2026",
  dataCurta: "29/11/2026",
  diaSemana: "domingo",
  dataIso: "2026-11-29",

  concentracao: "08:00",
  largada: "08:30",

  local: "Estacionamento da Arena",
  sede: "Sede Campestre do Clube Comercial",
  cidade: "Passo Fundo",
  estado: "RS",
  percurso:
    "Saída do estacionamento da Arena, na Sede Campestre, estrada de chão e retorno ao estacionamento da Arena.",

  /** O que substitui a taxa de inscrição. */
  custo: "1 brinquedo",

  /** Último dia para deixar o brinquedo num dos pontos de coleta. */
  prazoBrinquedo: "26 de novembro de 2026",
  prazoBrinquedoCurto: "26/11/2026",

  /**
   * Endereço público, usado na miniatura que o WhatsApp mostra e impresso no
   * flyer.
   *
   * Não é "rachao.vercel.app" porque esse nome já é de outra pessoa na
   * Vercel — conferido em 04/11/2026. Mudou de endereço? Mude aqui, e rode
   * `npm run flyer` para a peça sair com o novo.
   */
  site: "https://rachaobike.vercel.app",
  /** O mesmo endereço sem o https, que é como ele aparece no flyer. */
  siteCurto: "rachaobike.vercel.app",
} as const;

/**
 * Quem responde dúvida, na ordem em que aparece.
 *
 * O primeiro é o contato principal: é o nome que vai sozinho onde só cabe um,
 * como na tela de inscrições encerradas. Os dois aparecem juntos no flyer, na
 * página e no rodapé.
 */
export const CONTATOS = [
  {
    nome: "Yuri Menezes",
    papel: "Coordenador de ciclismo do Clube Comercial",
    telefone: "(54) 99180-9050",
    /** Só dígitos, com 55 na frente — é o formato que o wa.me exige. */
    whatsapp: "5554991809050",
  },
  {
    nome: "Gean Bedin",
    papel: "Rachão da Noite (RDN)",
    telefone: "(54) 99145-0676",
    whatsapp: "5554991450676",
  },
] as const;

/** Atalho para o contato principal, que é quem aparece quando só cabe um. */
export const CONTATO_PRINCIPAL = CONTATOS[0];

/**
 * O instante em que a inscrição fecha: fim do dia 26/11/2026 no horário de
 * Brasília (UTC-3), que em UTC cai às 3h do dia 27. Fixar em UTC evita o site
 * fechar mais cedo ou mais tarde conforme o fuso do servidor.
 *
 * É a mesma data do prazo do brinquedo de propósito: inscrição sem brinquedo
 * entregue não vale, então não adianta aceitar depois disso.
 */
const FIM_DAS_INSCRICOES = Date.UTC(2026, 10, 27, 3, 0, 0);

/** Já fechou? Vale tanto no servidor quanto no navegador. */
export function inscricoesEncerradas(agora: number = Date.now()): boolean {
  return agora >= FIM_DAS_INSCRICOES;
}

/**
 * As três modalidades.
 *
 * O `id` é o que vai para o banco e nunca muda; o `nome` é o que aparece na
 * tela e pode ser reescrito à vontade.
 */
export const CATEGORIAS = [
  {
    id: "rachao",
    nome: "Rachão",
    apelido: "Geral",
    publico: "Quem vem para competir",
    premiacao: "Troféu do 1º ao 5º lugar da geral",
    descricao:
      "A prova de verdade, cronometrada e disputada do começo ao fim. Largada junto com todo mundo, estrada de chão, e quem chegar na frente sobe no pódio.",
  },
  {
    id: "cicloturismo",
    nome: "Cicloturismo",
    apelido: "Passeio",
    publico: "Quem vem pedalar junto",
    premiacao: "Medalha de participação do desafio",
    descricao:
      "Mesmo trajeto, sem cronômetro e sem disputa. Ritmo de passeio, para quem quer completar o percurso e voltar inteiro para o churrasco.",
  },
  {
    id: "pedal-kids",
    nome: "Pedal Kids",
    apelido: "Crianças",
    publico: "A molecada, com responsável",
    premiacao: "Medalha de participação do desafio",
    descricao:
      "Percurso curto e protegido para as crianças, dentro da área da Sede Campestre. Toda inscrição precisa do nome e do CPF do responsável.",
  },
] as const;

export type IdCategoria = (typeof CATEGORIAS)[number]["id"];

/** Só o Pedal Kids pede responsável — é o que liga o termo no formulário. */
export const CATEGORIA_INFANTIL: IdCategoria = "pedal-kids";

export function categoriaPorId(id: string) {
  return CATEGORIAS.find((c) => c.id === id);
}

/**
 * Onde o brinquedo pode ser deixado. O `id` vai para o banco; o endereço é o
 * que a pessoa lê na hora de escolher.
 *
 * Os endereços ainda não foram conferidos com as lojas — estão como
 * referência para quem já conhece o ponto. Se um deles mudar, é uma linha.
 */
export const PONTOS_COLETA = [
  {
    id: "bike-tour",
    nome: "Loja Bike Tour",
    tipo: "Loja parceira",
  },
  {
    id: "gigante-bike",
    nome: "Loja Gigante Bike",
    tipo: "Loja parceira",
  },
  {
    id: "sede-vergueiro",
    nome: "Sede Vergueiro do Clube Comercial",
    tipo: "Sede do clube",
  },
  {
    id: "sede-campestre",
    nome: "Sede Campestre do Clube Comercial",
    tipo: "Sede do clube — é onde a prova larga",
  },
] as const;

export function pontoPorId(id: string) {
  return PONTOS_COLETA.find((p) => p.id === id);
}

/**
 * Termo que o responsável aceita ao inscrever uma criança. Texto curto de
 * propósito: termo que ninguém lê não protege ninguém.
 */
export const TERMO_MENOR = [
  `Declaro ser o responsável legal pela criança inscrita e autorizo a participação dela no Pedal Kids do ${EVENTO.nome}, no dia ${EVENTO.dataCurta}, na ${EVENTO.sede}.`,
  "Declaro que a criança está em condições de saúde para a atividade e que usará capacete durante todo o percurso.",
  "Assumo a responsabilidade por acompanhar e supervisionar a criança antes, durante e depois da atividade, e isento o Clube Comercial, a organização e os apoiadores de responsabilidade por danos decorrentes de conduta própria ou de condição de saúde não informada.",
  "Autorizo o uso da imagem da criança em fotos e vídeos do evento, sem fins comerciais.",
] as const;
