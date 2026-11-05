/**
 * O km 16,23 do Rachão cai a 2 km do Cicloturismo, e o Yuri disse que o ponto
 * de apoio é comum aos dois. Este script procura onde está o engano: se o
 * 16,23 era do outro percurso, ou se o ponto comum é o lugar onde os dois se
 * separam.
 */
import { lerTracado, ondeNoTracado } from "../lib/gpx.ts";

const rachao = lerTracado("rachao-comercial-54km.gpx");
const ciclo = lerTracado("ciclo-comercial-27km.gpx");

const em = (t, km) => {
  const i = Math.min(t.lat.length - 1, Math.round((km * 1000) / t.passo));
  return { lat: t.lat[i], lon: t.lon[i] };
};

console.log("== e se o 16,23 for do Cicloturismo? ==");
const p = em(ciclo, 16.23);
const noRachao = ondeNoTracado(rachao, p.lat, p.lon);
console.log(`  km 16,23 do Ciclo: ${p.lat}, ${p.lon}`);
console.log(
  `  cai no km ${noRachao.km} do Rachão, a ${noRachao.metrosDoTracado} m do traçado`,
);

console.log("\n== onde os dois se separam e se reencontram ==");
let separou = null;
let voltou = null;
for (let i = 0; i < rachao.lat.length; i++) {
  const d = ondeNoTracado(ciclo, rachao.lat[i], rachao.lon[i]);
  const km = (i * rachao.passo) / 1000;
  if (separou === null && d.metrosDoTracado > 60) separou = km;
  if (separou !== null && d.metrosDoTracado <= 60) voltou = km;
}
console.log(`  seguem juntos até o km ${separou} do Rachão`);
console.log(`  voltam a andar juntos no km ${voltou} do Rachão`);

const pSep = em(rachao, separou);
const pVolta = em(rachao, voltou);
console.log(`  separação: ${pSep.lat}, ${pSep.lon}`);
console.log(
  `    → no Ciclo é o km ${ondeNoTracado(ciclo, pSep.lat, pSep.lon).km}`,
);
console.log(`  reencontro: ${pVolta.lat}, ${pVolta.lon}`);
console.log(
  `    → no Ciclo é o km ${ondeNoTracado(ciclo, pVolta.lat, pVolta.lon).km}`,
);

console.log("\n== o ponto de apoio do Rachão, visto do Cicloturismo ==");
const apoio = em(rachao, 16.23);
let menor = Infinity;
let kmMenor = 0;
for (let i = 0; i < ciclo.lat.length; i++) {
  const d = ondeNoTracado(rachao, ciclo.lat[i], ciclo.lon[i]);
  void d;
}
// Distância do apoio a cada ponto do Ciclo, para achar o mais perto.
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
for (let i = 0; i < ciclo.lat.length; i++) {
  const d = metros(apoio.lat, apoio.lon, ciclo.lat[i], ciclo.lon[i]);
  if (d < menor) {
    menor = d;
    kmMenor = (i * ciclo.passo) / 1000;
  }
}
console.log(
  `  o mais perto que o Cicloturismo chega é ${Math.round(menor)} m, no km ${kmMenor.toFixed(1)}`,
);

console.log("\n== marcos do Rachão a cada 2 km, com distância do Ciclo ==");
for (let km = 0; km <= 54; km += 2) {
  const q = em(rachao, km);
  const d = ondeNoTracado(ciclo, q.lat, q.lon);
  const marca = d.metrosDoTracado <= 60 ? "junto" : `${d.metrosDoTracado} m`;
  console.log(`  km ${String(km).padStart(2)}: ${marca}`);
}
