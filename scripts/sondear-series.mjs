// TEMPORAL: consulta códigos de BCRPData e imprime su nombre oficial y últimos datos.
const API = "https://estadisticas.bcrp.gob.pe/estadisticas/series/api/";
const rango = (pre, a, b, suf) => Array.from({ length: b - a + 1 }, (_, i) => pre + String(a + i).padStart(5, "0") + suf);
const codigos = [
  ...rango("PN", 1713, 1735, "AM"),
  ...rango("PN", 1755, 1780, "AM"),
  ...rango("PN", 2516, 2545, "AQ"),
  ...rango("PN", 31879, 31890, "GM"),
  "PN37696PM", "PN37697PM", "PN38070GM", "PN02124PM"
];
for (const c of codigos) {
  const per = c.endsWith("Q") ? "2024-1/2026-4" : "2025-1/2026-12";
  try {
    const r = await fetch(API + c + "/json/" + per, { headers: { "User-Agent": "sala-de-eco (sondeo)" } });
    const t = (await r.text()).replace(/^﻿/, "").trim();
    const j = JSON.parse(t);
    const ps = j.periods || [];
    const last = ps.slice(-2).map(p => p.name + "=" + p.values[0]).join(" ");
    console.log(`${c}\t${j.config.title} | ${j.config.series.map(s => s.name).join(" ; ")}\t${last}`);
  } catch (e) { console.log(`${c}\tERROR ${e.message}`); }
}
