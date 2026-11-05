import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Lê o GPX e devolve o traçado reamostrado em passo fixo de distância.
 *
 * Roda só na geração da página (build), nunca no navegador: o arquivo original
 * tem 800 KB e mais de 10 mil pontos — mandar isso para o celular do ciclista
 * seria desperdício. O que vai para o navegador são ~560 pontos, um a cada
 * 100 m, o suficiente para o gráfico e para a leitura de inclinação.
 */

/** Passo da reamostragem, em metros. */
const PASSO = 100;

/** Janela do alisamento, em pontos para cada lado. */
const JANELA = 2;

export type TracadoGpx = {
  /** Passo entre pontos, em metros: a distância do ponto i é i * passo. */
  passo: number;
  lat: number[];
  lon: number[];
  /** Altitude em metros, como está no GPX (só interpolada no passo). */
  ele: number[];
  /** Inclinação em %, positiva na subida, calculada sobre altitude alisada. */
  incl: number[];
  distanciaTotal: number;
  altitudeMin: number;
  altitudeMax: number;
};

/*
 * Aqui NÃO se calcula subida acumulada de propósito.
 *
 * Reamostrar a cada 100 m engole as ondulações curtas, que é exatamente de onde
 * vem esse número: daria 837 m onde o traçado original dá 1.370 m e o oficial
 * diz 1.276 m. Um número desses na tela contradiria a própria página. A subida
 * divulgada mora em lib/percurso.ts, que vem da organização.
 */

type PontoBruto = { lat: number; lon: number; ele: number };

const RAIO_TERRA = 6371000;
const paraRad = (g: number) => (g * Math.PI) / 180;

/** Distância em metros entre dois pontos na superfície da Terra. */
function haversine(a: PontoBruto, b: PontoBruto): number {
  const dLat = paraRad(b.lat - a.lat);
  const dLon = paraRad(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(paraRad(a.lat)) * Math.cos(paraRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * RAIO_TERRA * Math.asin(Math.sqrt(s));
}

function lerPontos(xml: string): PontoBruto[] {
  const pontos: PontoBruto[] = [];
  // Um <trkpt lat=".." lon=".."> seguido, logo adiante, de um <ele>.
  const regex = /<trkpt[^>]*\blat="([-\d.]+)"[^>]*\blon="([-\d.]+)"[^>]*>([\s\S]*?)<\/trkpt>/g;
  let achado: RegExpExecArray | null;

  while ((achado = regex.exec(xml)) !== null) {
    const lat = Number(achado[1]);
    const lon = Number(achado[2]);
    const ele = Number(/<ele>([-\d.]+)<\/ele>/.exec(achado[3])?.[1] ?? "NaN");
    if (Number.isFinite(lat) && Number.isFinite(lon) && Number.isFinite(ele)) {
      pontos.push({ lat, lon, ele });
    }
  }
  return pontos;
}

/**
 * Em que quilômetro do traçado um ponto cai, e a que distância dele.
 *
 * A distância serve de conferência: ponto de hidratação ou fotógrafo fica em
 * cima do percurso, então qualquer coisa acima de uns 150 m é sinal de
 * coordenada trocada.
 */
export function ondeNoTracado(
  t: TracadoGpx,
  lat: number,
  lon: number,
): { km: number; metrosDoTracado: number } {
  const { indice, metros } = maisProximo(t, lat, lon);
  return {
    km: Number(((indice * t.passo) / 1000).toFixed(1)),
    metrosDoTracado: Math.round(metros),
  };
}

/** Ponto do traçado mais perto de uma coordenada. */
function maisProximo(
  t: TracadoGpx,
  lat: number,
  lon: number,
): { indice: number; metros: number } {
  let metros = Infinity;
  let indice = 0;
  for (let i = 0; i < t.lat.length; i++) {
    const d = haversine({ lat, lon, ele: 0 }, { lat: t.lat[i], lon: t.lon[i], ele: 0 });
    if (d < metros) {
      metros = d;
      indice = i;
    }
  }
  return { indice, metros };
}

/**
 * Para que lado o selo de um ponto deve fugir do traçado.
 *
 * Devolve um vetor unitário em coordenadas de tela — x cresce para a direita,
 * y para baixo —, pronto para o navegador multiplicar por pixels. A direção é
 * perpendicular à estrada naquele ponto e aponta para fora do circuito: assim
 * a haste cruza o traçado em ângulo reto e o símbolo nunca cai sobre a linha
 * da prova, que é justamente o que o ciclista quer ver no mapa.
 */
export function direcaoDeFuga(
  t: TracadoGpx,
  lat: number,
  lon: number,
  /** Giro em graus, no sentido horário, para desempatar selos vizinhos. */
  giro = 0,
): { dx: number; dy: number } {
  const { indice } = maisProximo(t, lat, lon);
  const fim = t.lat.length - 1;
  // O cosseno da latitude corrige o encurtamento dos meridianos: sem ele, a
  // perpendicular sai torta nesta latitude.
  const cos = Math.cos(paraRad(lat));

  const a = Math.max(0, indice - 2);
  const b = Math.min(fim, indice + 2);
  const vx = (t.lon[b] - t.lon[a]) * cos;
  const vy = -(t.lat[b] - t.lat[a]);

  // Para fora do circuito é para longe do centro do traçado.
  const centroLat = t.lat.reduce((s, v) => s + v, 0) / t.lat.length;
  const centroLon = t.lon.reduce((s, v) => s + v, 0) / t.lon.length;
  const fx = (lon - centroLon) * cos;
  const fy = -(lat - centroLat);

  let px = -vy;
  let py = vx;
  const tamanho = Math.hypot(px, py);
  if (tamanho === 0) {
    // Traçado parado nesse pedaço: resta apontar direto para fora.
    const t2 = Math.hypot(fx, fy) || 1;
    px = fx / t2;
    py = fy / t2;
  } else {
    px /= tamanho;
    py /= tamanho;
    if (px * fx + py * fy < 0) {
      px = -px;
      py = -py;
    }
  }

  // O giro é no sentido horário da tela, onde o y cresce para baixo.
  const rad = paraRad(giro);
  const gx = px * Math.cos(rad) - py * Math.sin(rad);
  const gy = px * Math.sin(rad) + py * Math.cos(rad);
  return { dx: Number(gx.toFixed(3)), dy: Number(gy.toFixed(3)) };
}

/** Média móvel: tira o serrilhado do GPS antes de calcular inclinação. */
function alisar(valores: number[], janela: number): number[] {
  return valores.map((_, i) => {
    const de = Math.max(0, i - janela);
    const ate = Math.min(valores.length - 1, i + janela);
    let soma = 0;
    for (let k = de; k <= ate; k++) soma += valores[k];
    return soma / (ate - de + 1);
  });
}

export function lerTracado(arquivo: string): TracadoGpx {
  const xml = readFileSync(
    path.join(process.cwd(), "public", "percurso", arquivo),
    "utf8",
  );
  const brutos = lerPontos(xml);
  if (brutos.length < 2) {
    throw new Error(`GPX sem pontos utilizáveis: ${arquivo}`);
  }

  // Distância acumulada ponto a ponto.
  const acumulada = [0];
  for (let i = 1; i < brutos.length; i++) {
    acumulada.push(acumulada[i - 1] + haversine(brutos[i - 1], brutos[i]));
  }
  const total = acumulada[acumulada.length - 1];

  // Reamostragem em passo fixo, interpolando dentro do segmento.
  const lat: number[] = [];
  const lon: number[] = [];
  const eleBruta: number[] = [];
  let cursor = 0;

  for (let alvo = 0; alvo <= total; alvo += PASSO) {
    while (cursor < acumulada.length - 2 && acumulada[cursor + 1] < alvo) cursor++;
    const a = brutos[cursor];
    const b = brutos[cursor + 1] ?? a;
    const trecho = acumulada[cursor + 1] - acumulada[cursor];
    const fracao = trecho > 0 ? (alvo - acumulada[cursor]) / trecho : 0;
    const t = Math.min(1, Math.max(0, fracao));
    lat.push(a.lat + (b.lat - a.lat) * t);
    lon.push(a.lon + (b.lon - a.lon) * t);
    eleBruta.push(a.ele + (b.ele - a.ele) * t);
  }

  // A altitude exibida é a do arquivo: alisar aqui achataria os picos e o
  // ciclista leria 714 m onde o ponto mais alto da prova tem 720 m.
  const ele = eleBruta;

  // Já a inclinação sai da altitude alisada e medida sobre 200 m. Sem isso, o
  // serrilhado do GPS vira picos de 20% que não existem na estrada.
  const suave = alisar(eleBruta, JANELA);
  const incl = suave.map((_, i) => {
    const de = Math.max(0, i - 1);
    const ate = Math.min(suave.length - 1, i + 1);
    const distancia = (ate - de) * PASSO;
    return distancia > 0 ? ((suave[ate] - suave[de]) / distancia) * 100 : 0;
  });

  const arredondar = (v: number, casas: number) => Number(v.toFixed(casas));

  return {
    passo: PASSO,
    lat: lat.map((v) => arredondar(v, 5)),
    lon: lon.map((v) => arredondar(v, 5)),
    ele: ele.map((v) => arredondar(v, 1)),
    incl: incl.map((v) => arredondar(v, 1)),
    distanciaTotal: arredondar(total, 0),
    altitudeMin: Math.round(Math.min(...ele)),
    altitudeMax: Math.round(Math.max(...ele)),
  };
}
