/* Lectura de series de BCRPData.
   Lo usan las páginas de estadisticas/ (en el navegador) y
   scripts/actualizar-estadisticas.mjs (en la GitHub Action que regenera datos.js). */
(function (root) {
  const API = "https://estadisticas.bcrp.gob.pe/estadisticas/series/api/";

  // Series de cada página: códigos BCRPData, frecuencia (M mensual, Q trimestral) y periodo inicial [año, mes|trimestre].
  const SERIES = {
    tasa:      { codigos: ["PD04722MM"], freq: "M", inicio: [2003, 9] },
    inflacion: { codigos: ["PN01273PM"], freq: "M", inicio: [2002, 1] },
    resultado: { codigos: ["PN39524FM"], freq: "M", inicio: [2007, 1] },
    deuda:     { codigos: ["PN03432FQ", "PN03433FQ", "PN03442FQ", "PN03481FQ"], freq: "Q", inicio: [1999, 1] }
  };

  const MESES = { ene: 1, jan: 1, feb: 2, mar: 3, abr: 4, apr: 4, may: 5, jun: 6, jul: 7, ago: 8, aug: 8,
    sep: 9, set: 9, oct: 10, nov: 11, dic: 12, dec: 12 };

  function url(clave, hoy) {
    const s = SERIES[clave], y = (hoy || new Date()).getFullYear();
    return API + s.codigos.join("-") + "/json/" + s.inicio.join("-") + "/" + y + "-" + (s.freq === "Q" ? 4 : 12);
  }

  const anio = t => { const n = +t; return t.length <= 2 ? (n < 50 ? 2000 + n : 1900 + n) : n; };

  // "Ene.2002", "Sep.03" → [2002, 1]; "T1.99", "T1.1999" → [1999, 1]
  function periodo(nombre, freq) {
    const t = String(nombre || "").trim().toLowerCase();
    let m;
    if (freq === "Q" && (m = t.match(/^(?:t|q)\s*([1-4])[.\s-]*(\d{2}|\d{4})$/))) return [anio(m[2]), +m[1]];
    if (freq === "M" && (m = t.match(/^([a-zñ]{3})[a-zñ]*[.\s-]*(\d{2}|\d{4})$/)) && MESES[m[1]]) return [anio(m[2]), MESES[m[1]]];
    return null;
  }

  // Convierte la respuesta JSON de la API en { inicio, filas } (una fila por periodo, un valor por código).
  function parsear(clave, json) {
    const s = SERIES[clave];
    const obj = typeof json === "string" ? JSON.parse(json.replace(/^﻿/, "").trim()) : json;
    const per = obj && obj.periods;
    if (!Array.isArray(per) || !per.length) throw new Error("Respuesta sin periodos");
    const num = v => { const x = parseFloat(String(v).replace(",", ".")); return isFinite(x) ? Math.round(x * 100) / 100 : null; };
    let filas = per.map(p => (p.values || []).slice(0, s.codigos.length).map(num));
    if (filas.some(f => f.length !== s.codigos.length)) throw new Error("Número de series inesperado");
    const inicio = periodo(per[0].name, s.freq) || s.inicio.slice();
    // Descarta periodos aún sin dato al inicio y al final ("n.d.").
    const vacia = f => f.some(v => v === null);
    let a = 0, b = filas.length;
    while (a < b && vacia(filas[a])) a++;
    while (b > a && vacia(filas[b - 1])) b--;
    if (b - a < 12) throw new Error("Serie demasiado corta");
    const n = s.freq === "Q" ? 4 : 12, k = inicio[0] * n + inicio[1] - 1 + a;
    filas = filas.slice(a, b);
    return { inicio: [Math.floor(k / n), (k % n) + 1], filas };
  }

  // Navegador: intenta la API en vivo; si falla (red, CORS, tiempo), usa la copia de datos.js.
  function cargar(clave, espera) {
    const local = root.BCRP_DATOS && root.BCRP_DATOS.series[clave];
    const copia = local ? { inicio: local.inicio, filas: local.filas, vivo: false, fecha: root.BCRP_DATOS.actualizado } : null;
    if (typeof fetch !== "function") return Promise.resolve(copia);
    const ctl = typeof AbortController === "function" ? new AbortController() : null;
    const t = setTimeout(() => ctl && ctl.abort(), espera || 6000);
    return fetch(url(clave), { signal: ctl ? ctl.signal : undefined })
      .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
      .then(txt => {
        const d = parsear(clave, txt);
        if (copia && d.filas.length < copia.filas.length * 0.9) throw new Error("Respuesta incompleta");
        return { inicio: d.inicio, filas: d.filas, vivo: true };
      })
      .catch(() => copia)
      .finally(() => clearTimeout(t));
  }

  const BCRP = { API, SERIES, url, periodo, parsear, cargar };
  if (typeof module === "object" && module.exports) module.exports = BCRP; else root.BCRP = BCRP;
})(typeof window !== "undefined" ? window : globalThis);
