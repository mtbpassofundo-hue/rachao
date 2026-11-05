/**
 * Dados dos percursos do Rachão Bike 2026. Mudou o traçado ou um ponto de
 * apoio, muda aqui.
 *
 * Os números de distância, altitude e subida foram medidos nos próprios GPX
 * por `scripts/medir-percurso.mjs` — não são estimativa nem número de
 * divulgação. Trocou o arquivo, rode o script de novo e atualize.
 */

export const CATEGORIAS = [
  {
    id: "rachao",
    nome: "Rachão",
    apelido: "Competição",
    distancia: "54,5 km",
    /**
     * Subida somada ponto a ponto no GPX. É o mesmo cálculo que o relógio do
     * ciclista faz, então costuma bater com o Strava; a organização pode
     * divulgar um número redondo diferente.
     */
    subida: "975 m",
    altitude: "606–744 m",
    arquivo: "rachao-comercial-54km.gpx",
    /** Vermelho: é a cor que mais se destaca sobre o mapa claro do OSM. */
    cor: "#ff3d5a",
  },
  {
    id: "cicloturismo",
    nome: "Cicloturismo",
    apelido: "Passeio",
    distancia: "27,6 km",
    subida: "485 m",
    altitude: "665–744 m",
    arquivo: "ciclo-comercial-27km.gpx",
    cor: "#3b6cff",
  },
] as const;

export type IdPercurso = (typeof CATEGORIAS)[number]["id"];

/**
 * Como os dois percursos se relacionam, medido no GPX:
 *
 *   km  0,0 – 13,8  os dois juntos, saindo do Clube
 *   km 13,8 – 16,2  só o Rachão, indo até o ponto de apoio
 *   km 16,2 – 38,2  a corrida do Rachão: sai do apoio e volta nele
 *   km 38,2 – 40,6  só o Rachão, voltando do apoio até a bifurcação
 *   km 40,6 – 54,5  os dois juntos de novo, de volta ao Clube
 *
 * O Cicloturismo cobre o mesmo primeiro e último pedaço: a bifurcação cai no
 * km 13,8 dele também, e dali ele já emenda na volta.
 */
export const BIFURCACAO = { lat: -28.30999, lon: -52.25787 } as const;

export type TipoDePonto = "apoio" | "marco";

export const PONTOS_INTERESSE: {
  nome: string;
  tipo: TipoDePonto;
  lat: number;
  lon: number;
  /** Número no selo, na ordem da prova. */
  numero?: number;
  /** Texto curto ao lado do selo, quando o símbolo sozinho não basta. */
  rotulo?: string;
  /** O que esperar ali. Vai para o balão do mapa e para a lista. */
  detalhe?: string;
  /**
   * Quanto o selo se afasta do traçado, em multiplicador da distância padrão.
   * Serve para separar dois pontos vizinhos que cairiam um sobre o outro.
   */
  desvio?: number;
  /**
   * Direção fixa do selo, em coordenadas de tela (x à direita, y para baixo),
   * quando a perpendicular calculada não é o que se quer. Vetor unitário.
   */
  para?: { dx: number; dy: number };
}[] = [
  {
    nome: "Ponto de Apoio",
    tipo: "apoio",
    numero: 1,
    rotulo: "Apoio",
    detalhe: "O Rachão passa duas vezes aqui: na ida e na volta da corrida.",
    // km 16,23 do Rachão, tirado do próprio arquivo. O mesmo lugar é o km
    // 38,15 na volta — os dois pontos distam 12 m, o que confirma os dois
    // quilômetros que a organização passou.
    lat: -28.32824,
    lon: -52.25627,
    // Haste longa: o traçado passa duas vezes por aqui e o selo precisa sair
    // de cima das duas linhas.
    desvio: 2.2,
  },
  {
    nome: "Bifurcação",
    tipo: "marco",
    // km 13,8 nos dois percursos: é onde o Rachão desgarra para buscar o
    // ponto de apoio e o Cicloturismo já emenda a volta.
    lat: BIFURCACAO.lat,
    lon: BIFURCACAO.lon,
    para: { dx: -1, dy: 0 },
    desvio: 2.6,
  },
];

/**
 * Trechos com nome próprio: o pedaço da prova que passa por eles é desenhado
 * na cor do trecho, por cima da linha da categoria.
 *
 * Aqui o recorte é por quilômetro, e não por coordenada como seria natural:
 * a corrida começa e termina no mesmo lugar, então procurar o ponto mais
 * próximo acharia duas vezes o mesmo índice e o trecho sairia vazio.
 */
export const TRECHOS = [
  {
    nome: "Corrida do Rachão",
    /** Amarelo sobre o vermelho da categoria: lê-se de longe, no mapa claro. */
    cor: "#ffc400",
    categoria: "rachao" as IdPercurso,
    kmDe: 16.23,
    kmAte: 38.15,
    /** 21,92 km — o número que a organização divulga. */
    extensao: "21,92 km",
  },
] as const;

/**
 * Pontos de referência listados em texto, abaixo do mapa.
 *
 * As coordenadas vêm dos GPX, não de anotação à mão: GPS digitado errado é
 * ciclista parado no acostamento procurando uma bifurcação que não existe.
 */
export const REFERENCIAS = [
  {
    marca: "L",
    titulo: "Largada e chegada",
    detalhe:
      "Estacionamento da Arena, na Sede Campestre. As duas provas largam e terminam aqui, e os primeiros 13,8 km são os mesmos para todo mundo.",
    gps: "-28.26930, -52.35553",
  },
  {
    marca: "1",
    titulo: "Bifurcação no km 13,8",
    detalhe:
      "O Cicloturismo vira para a volta e o Rachão segue mais 2,4 km até o ponto de apoio. Na volta, o Rachão passa por aqui de novo no km 40,6.",
    gps: "-28.30999, -52.25787",
  },
  {
    marca: "2",
    titulo: "Ponto de apoio no km 16,2",
    detalhe:
      "Onde a corrida do Rachão começa. Os 21,92 km em amarelo saem daqui e voltam para cá, no km 38,2 — depois é o caminho de casa.",
    gps: "-28.32824, -52.25627",
  },
] as const;
