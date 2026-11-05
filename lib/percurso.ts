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
 *   km 13,8 – 40,6  a corrida do Rachão: sai do apoio e volta nele
 *   km 40,6 – 54,5  os dois juntos de novo, de volta ao Clube no seu ritmo
 *
 * O ponto de apoio é a bifurcação: o mesmo km 13,8 nos dois percursos. Para o
 * Cicloturismo é o ponto de retorno, bem no meio da prova dele; para o
 * Rachão é onde a parte cronometrada começa e termina.
 *
 * Por que aqui e não 2,4 km adiante: a ida e a volta do Rachão usam a mesma
 * estrada do km 12 ao km 18 — qualquer ponto nesse pedaço fecha um laço. O
 * que decide é o Cicloturismo, que só passa neste.
 */
export const APOIO = { lat: -28.30999, lon: -52.25787 } as const;

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
    detalhe:
      "Na bifurcação, km 13,8 das duas provas. O Cicloturismo retorna aqui; o Rachão começa e termina a corrida aqui.",
    lat: APOIO.lat,
    lon: APOIO.lon,
    // Haste longa: a ida e a volta passam coladas neste ponto, e o selo
    // precisa sair de cima das duas linhas.
    desvio: 2.4,
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
    // Sai do apoio no km 13,8 e volta nele no km 40,6 — os dois pontos caem
    // a 11 m um do outro no GPX.
    kmDe: 13.8,
    kmAte: 40.6,
    extensao: "26,8 km",
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
    titulo: "Ponto de apoio no km 13,8",
    detalhe:
      "A bifurcação, e o mesmo quilômetro nas duas provas. O Cicloturismo retorna daqui. O Rachão larga na corrida aqui e volta a este ponto no km 40,6 — são os 26,8 km em amarelo.",
    gps: "-28.30999, -52.25787",
  },
  {
    marca: "2",
    titulo: "Volta ao clube no seu ritmo",
    detalhe:
      "Depois do apoio, os últimos 13,9 km são os mesmos para todo mundo, pelo caminho da ida. Sem cronômetro: é só voltar e encerrar o pedal.",
    gps: "-28.26930, -52.35553",
  },
] as const;
