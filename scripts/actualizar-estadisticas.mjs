// Descarga las series de BCRPData y regenera estadisticas/datos.js,
// la copia local que usan las páginas de estadisticas/ cuando no pueden leer la API en vivo.
// Uso: node scripts/actualizar-estadisticas.mjs
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const BCRP = require("../estadisticas/bcrp.js");
const DESTINO = fileURLToPath(new URL("../estadisticas/datos.js", import.meta.url));

export function serializar(series, fecha) {
  const partes = Object.entries(series).map(([k, s]) =>
    `    ${k}: { inicio: ${JSON.stringify(s.inicio)}, filas: ${JSON.stringify(s.filas)} }`);
  return "// Copia local de las series de BCRPData. Generado por scripts/actualizar-estadisticas.mjs: no editar a mano.\n" +
    `window.BCRP_DATOS = {\n  actualizado: ${JSON.stringify(fecha)},\n  series: {\n${partes.join(",\n")}\n  }\n};\n`;
}

function leerActual() {
  const window = {};
  new Function("window", readFileSync(DESTINO, "utf8"))(window);
  return window.BCRP_DATOS;
}

async function descargar(clave) {
  for (let intento = 1; ; intento++) {
    try {
      const r = await fetch(BCRP.url(clave), { headers: { "User-Agent": "sala-de-eco (actualizacion de estadisticas)" } });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return BCRP.parsear(clave, await r.text());
    } catch (e) {
      if (intento >= 3) throw e;
      await new Promise(ok => setTimeout(ok, 5000 * intento));
    }
  }
}

async function main() {
  const actual = leerActual();
  const series = { ...actual.series };
  let cambios = 0, errores = 0;
  for (const clave of Object.keys(BCRP.SERIES)) {
    try {
      const nuevo = await descargar(clave), viejo = actual.series[clave];
      // Protección ante respuestas truncadas: no se acepta una serie mucho más corta que la guardada.
      if (viejo && nuevo.filas.length < viejo.filas.length * 0.9) throw new Error(`solo ${nuevo.filas.length} periodos`);
      if (JSON.stringify(nuevo) !== JSON.stringify(viejo)) { series[clave] = nuevo; cambios++; }
      console.log(`${clave}: ${nuevo.filas.length} periodos desde ${nuevo.inicio.join("-")}`);
    } catch (e) {
      errores++;
      console.error(`${clave}: no se pudo actualizar (${e.message}); se conserva la copia anterior`);
    }
  }
  if (cambios) {
    writeFileSync(DESTINO, serializar(series, new Date().toISOString().slice(0, 10)));
    console.log(`datos.js actualizado (${cambios} series con cambios)`);
  } else console.log("Sin cambios");
  if (errores === Object.keys(BCRP.SERIES).length) process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
