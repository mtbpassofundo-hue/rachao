/**
 * O Yuri diz que o ponto de apoio é na bifurcação, e que a corrida do Rachão
 * começa e termina ali. Mas os quilômetros que ele passou antes (16,23 e
 * 38,15) apontam para um lugar 2,4 km adiante.
 *
 * Este script mede os dois candidatos lado a lado, para a conversa ser sobre
 * o que o arquivo diz e não sobre o que cada um lembra.
 */
import { lerTracado, ondeNoTracado } from "../lib/gpx.ts";

const RAIO = 6371000;
const rad = (g) => (g * Math.PI) / 180;
const metros = (aLat, aLon, bLat, bLon) => {
  const dLat = rad(bLat - aLat);
  const dLon = rad(bLon - aLon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * RAIO * Math.asin(Math.sqrt(s));
};

const rachao = lerTracado("rachao-comercial-54km.gpx");
const ciclo = lerTracado("ciclo-comercial-27km.gpx");

const em = (t, km) => {
  const i = Math.min(t.lat.length - 1, Math.round((km * 1000) / t.passo));
  return { i, lat: t.lat[i], lon: t.lon[i] };
};

/**
 * Onde o Rachão volta a passar pelo mesmo lugar, para cada km da ida.
 * É isso que define o vértice do laço: o ponto da ida cujo "gêmeo" na volta
 * está mais perto dele.
 */
console.log("== onde a ida encontra a volta ==");
console.log("  km ida  →  km volta  ·  distância entre os dois");
for (let km = 12; km <= 18; km += 0.5) {
  const p = em(rachao, km);
  // Procura só na segunda metade, senão acha ele mesmo.
  let menor = Infinity;
  let kmVolta = 0;
  for (let j = Math.round(rachao.lat.length * 0.5); j < rachao.lat.length; j++) {
    const d = metros(p.lat, p.lon, rachao.lat[j], rachao.lon[j]);
    if (d < menor) {
      menor = d;
      kmVolta = (j * rachao.passo) / 1000;
    }
  }
  const noCiclo = ondeNoTracado(ciclo, p.lat, p.lon);
  console.log(
    `  ${km.toFixed(2).padStart(6)} → ${kmVolta.toFixed(2).padStart(6)} · ${String(Math.round(menor)).padStart(5)} m   |  Cicloturismo a ${String(noCiclo.metrosDoTracado).padStart(5)} m`,
  );
}

console.log("\n== os dois candidatos a ponto de apoio ==");
const candidatos = [
  { nome: "Bifurcação (onde o Ciclo vira)", km: 13.8 },
  { nome: "Vértice do laço (o que o Yuri passou)", km: 16.23 },
];
for (const c of candidatos) {
  const p = em(rachao, c.km);
  let menor = Infinity;
  let kmVolta = 0;
  for (let j = Math.round(rachao.lat.length * 0.5); j < rachao.lat.length; j++) {
    const d = metros(p.lat, p.lon, rachao.lat[j], rachao.lon[j]);
    if (d < menor) {
      menor = d;
      kmVolta = (j * rachao.passo) / 1000;
    }
  }
  const noCiclo = ondeNoTracado(ciclo, p.lat, p.lon);
  console.log(`\n  ${c.nome}`);
  console.log(`    km ${c.km} do Rachão · ${p.lat}, ${p.lon}`);
  console.log(`    o Rachão volta a passar aqui no km ${kmVolta.toFixed(2)} (a ${Math.round(menor)} m)`);
  console.log(`    corrida de ${(kmVolta - c.km).toFixed(2)} km`);
  console.log(
    `    Cicloturismo passa a ${noCiclo.metrosDoTracado} m daqui (km ${noCiclo.km} dele)`,
  );
}

const a = em(rachao, 13.8);
const b = em(rachao, 16.23);
console.log(
  `\n  os dois candidatos distam ${Math.round(metros(a.lat, a.lon, b.lat, b.lon))} m em linha reta,`,
);
console.log(`  e 2,43 km de estrada entre um e outro.`);
