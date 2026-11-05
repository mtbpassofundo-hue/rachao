/**
 * Mede os dois traçados e confere o que o Yuri contou: que o ponto de apoio
 * do km 16,23 é o mesmo nos dois percursos, e que a corrida do Rachão sai
 * dele no km 16,23 e volta nele no km 38,15.
 *
 * Nada é desenhado antes disso bater. Número de quilometragem que não casa
 * com o arquivo vira linha torta no mapa e ponto de apoio no lugar errado.
 */
import { lerTracado, ondeNoTracado } from "../lib/gpx.ts";

const RAIO = 6371000;
const rad = (g) => (g * Math.PI) / 180;
function metros(aLat, aLon, bLat, bLon) {
  const dLat = rad(bLat - aLat);
  const dLon = rad(bLon - aLon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * RAIO * Math.asin(Math.sqrt(s));
}

/** Soma só as subidas, como fazem os relógios — serve de referência. */
function subidaBruta(t) {
  let soma = 0;
  for (let i = 1; i < t.ele.length; i++) {
    const d = t.ele[i] - t.ele[i - 1];
    if (d > 0) soma += d;
  }
  return Math.round(soma);
}

const rachao = lerTracado("rachao-comercial-54km.gpx");
const ciclo = lerTracado("ciclo-comercial-27km.gpx");

for (const [nome, t] of [
  ["Rachão 54km", rachao],
  ["Cicloturismo 27km", ciclo],
]) {
  console.log(`\n== ${nome} ==`);
  console.log(`  distância: ${(t.distanciaTotal / 1000).toFixed(2)} km`);
  console.log(`  pontos reamostrados: ${t.lat.length} (a cada ${t.passo} m)`);
  console.log(`  altitude: ${t.altitudeMin}–${t.altitudeMax} m`);
  console.log(`  subida bruta: ${subidaBruta(t)} m`);
  console.log(`  largada: ${t.lat[0]}, ${t.lon[0]}`);
  const f = t.lat.length - 1;
  console.log(`  chegada: ${t.lat[f]}, ${t.lon[f]}`);
  console.log(
    `  largada e chegada distam ${Math.round(metros(t.lat[0], t.lon[0], t.lat[f], t.lon[f]))} m`,
  );
}

// ─── O ponto de apoio ──────────────────────────────────────────────────────
const indiceApoio = Math.round((16.23 * 1000) / rachao.passo);
const apoio = { lat: rachao.lat[indiceApoio], lon: rachao.lon[indiceApoio] };
console.log("\n== ponto de apoio (km 16,23 do Rachão) ==");
console.log(`  coordenada: ${apoio.lat}, ${apoio.lon}`);

const noCiclo = ondeNoTracado(ciclo, apoio.lat, apoio.lon);
console.log(
  `  no Cicloturismo cai no km ${noCiclo.km}, a ${noCiclo.metrosDoTracado} m do traçado`,
);

const indiceVolta = Math.round((38.15 * 1000) / rachao.passo);
const volta = { lat: rachao.lat[indiceVolta], lon: rachao.lon[indiceVolta] };
console.log("\n== volta da corrida (km 38,15 do Rachão) ==");
console.log(`  coordenada: ${volta.lat}, ${volta.lon}`);
console.log(
  `  distância até o ponto de apoio: ${Math.round(metros(apoio.lat, apoio.lon, volta.lat, volta.lon))} m`,
);
console.log(
  `  trecho da corrida: ${((indiceVolta - indiceApoio) * rachao.passo / 1000).toFixed(2)} km`,
);

// ─── Quanto os dois percursos andam juntos ─────────────────────────────────
console.log("\n== sobreposição dos dois percursos ==");
let juntos = 0;
const foraDoCiclo = [];
for (let i = 0; i < rachao.lat.length; i++) {
  const d = ondeNoTracado(ciclo, rachao.lat[i], rachao.lon[i]);
  const kmRachao = (i * rachao.passo) / 1000;
  if (d.metrosDoTracado <= 60) {
    juntos++;
  } else {
    foraDoCiclo.push(kmRachao);
  }
}
console.log(
  `  ${((juntos * rachao.passo) / 1000).toFixed(1)} km do Rachão passam a 60 m ou menos do Cicloturismo`,
);
if (foraDoCiclo.length) {
  const de = foraDoCiclo[0];
  const ate = foraDoCiclo[foraDoCiclo.length - 1];
  console.log(`  o que é exclusivo do Rachão vai do km ${de} ao km ${ate}`);
  // Mostra se é um pedaço só ou vários.
  const saltos = [];
  for (let i = 1; i < foraDoCiclo.length; i++) {
    if (foraDoCiclo[i] - foraDoCiclo[i - 1] > 0.25) {
      saltos.push(`${foraDoCiclo[i - 1]} → ${foraDoCiclo[i]}`);
    }
  }
  console.log(
    saltos.length
      ? `  com interrupções em: ${saltos.join(", ")}`
      : "  em um pedaço contínuo",
  );
}
