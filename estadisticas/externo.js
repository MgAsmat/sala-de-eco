/* Gráficos del Sector Externo, en millones de US$: barras apiladas de componentes y líneas de totales.
   Lo usan balanza-comercial.html, exportaciones.html, importaciones.html (mensuales) y balanza-de-pagos.html (trimestral).
   CFG = {
     freq: "M"|"Q",
     campos: { id: { nombre, corto, color (variable CSS), f: fila => valor } },
     vistas: [{ id, nombre, barras: [ids], lineas: [ids], pct, total }],  // pct: barras como % del total; total: campo del pie del tooltip
     tabla: [ids],                       // columnas de la tabla anual; la última columna compara la primera con el año anterior
     tablaCambio: "pct"|"dif",           // esa comparación: variación % o diferencia en millones de US$
     encabezado: ctx => ({ val, meta }), // con el último dato (ctx.ult, ctx.hace1, ctx.ant)
     resumen: (sl, ctx) => [[k, v, d]],  // tarjetas del periodo elegido
     periodoInicial: años
   } */
function iniciarExterno(D, CFG) {
  const Q = CFG.freq === "Q", P = Q ? 4 : 12;
  const MES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const MESL = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const ROM = ["I", "II", "III", "IV"];
  const F = CFG.campos, IDS = Object.keys(F);
  const $ = id => document.getElementById(id);

  // Datos del periodo (base) y suma móvil de los últimos P periodos (acum): 12 meses o 4 trimestres
  const base = D.filas.map((f, i) => {
    const k = D.inicio[0] * P + D.inicio[1] - 1 + i, y = Math.floor(k / P), p = k % P;
    const o = { y, p, lab: Q ? "T" + (p + 1) + "." + y : MES[p] + "." + y, long: Q ? ROM[p] + " trim. " + y : MESL[p] + " " + y };
    IDS.forEach(id => { o[id] = Math.round(F[id].f(f) * 100) / 100; });
    return o;
  });
  const N = base.length;
  const acum = base.map((d, i) => {
    if (i < P - 1) return null;
    const o = { ...d };
    IDS.forEach(id => { let s = 0; for (let j = i - P + 1; j <= i; j++) s += base[j][id]; o[id] = s; });
    return o;
  });

  const nf = (v, dec) => v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }).replace(/[,.]/g, c => c === "," ? " " : ",");
  const fmt = v => nf(Math.round(v), 0);
  const sg = v => (Math.round(v) > 0 ? "+" : Math.round(v) < 0 ? "−" : "") + fmt(Math.abs(v));
  const pc = v => (v > 0.05 ? "+" : v < -0.05 ? "−" : "") + nf(Math.abs(v), 1) + "%";
  const var_ = (v, w) => w ? (v / w - 1) * 100 : null;
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const rgba = (hex, al) => { const h = hex.replace("#", ""); return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${al})`; };
  const cap = s => s.replace(/^./, c => c.toUpperCase());
  const sube = v => Math.abs(v) < 0.05 ? "flat" : v > 0 ? "pos" : "neg";
  const isDark = () => document.documentElement.dataset.theme === "dark" || (matchMedia("(prefers-color-scheme: dark)").matches && document.documentElement.dataset.theme !== "light");
  const anim = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 450;
  const nom = id => F[id].corto || F[id].nombre;
  const ctx = { Q, P, base, acum, N, fmt, sg, pc, nf, var_, sube, cap, F,
    ult: base[N - 1], ant: base[N - 2], hace1: base[N - 1 - P], ultA: acum[N - 1], hace1A: acum[N - 1 - P] };

  // Encabezado
  const h = CFG.encabezado(ctx);
  $("nowVal").innerHTML = h.val; $("nowMeta").innerHTML = h.meta;

  let a = 0, b = N - 1, drag = null, vista = CFG.vistas[0], modo = "base";
  const serie = () => modo === "acum" ? acum : base;

  // Botones de vista y de periodicidad
  if (CFG.vistas.length > 1) {
    $("vistas").innerHTML = CFG.vistas.map((v, i) => `<button type="button" data-i="${i}" aria-pressed="${i === 0}">${v.nombre}</button>`).join("");
    $("vistas").addEventListener("click", e => { const t = e.target.closest("button"); if (!t) return; vista = CFG.vistas[+t.dataset.i];
      $("vistas").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === t ? "true" : "false")); render(); });
  } else $("vistas").hidden = true;
  $("modos").addEventListener("click", e => { const t = e.target.closest("button"); if (!t) return; modo = t.dataset.m;
    $("modos").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === t ? "true" : "false"));
    if (modo === "acum" && a < P - 1) a = Math.min(P - 1, b - MINSPAN);
    render(); });

  const cross = { id: "cross", afterDatasetsDraw(c) { const t = c.tooltip; if (!t || !t.getActiveElements().length) return; const x = t.getActiveElements()[0].element.x, g = c.ctx; g.save(); g.strokeStyle = css("--gold"); g.lineWidth = 1; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(x, c.chartArea.top); g.lineTo(x, c.chartArea.bottom); g.stroke(); g.restore(); } };
  const tipFont = { padding: 10, titleFont: { family: "Barlow Condensed", size: 14, weight: "600" }, bodyFont: { family: "Barlow", size: 13 }, footerFont: { family: "Barlow", size: 12, weight: "400" } };

  const chart = new Chart($("chart"), {
    type: "bar",
    data: { labels: [], datasets: [] },
    options: {
      responsive: true, maintainAspectRatio: false, animation: { duration: anim },
      interaction: { mode: "index", intersect: false },
      layout: { padding: { top: 8, right: 8 } },
      scales: {
        x: { stacked: true, grid: { display: false }, border: { display: false }, ticks: { autoSkip: false, maxRotation: 0, font: { family: "Barlow", size: 12 } } },
        y: { stacked: true, border: { display: false }, ticks: { font: { family: "Barlow", size: 12 } } }
      },
      plugins: {
        legend: { display: false },
        tooltip: { displayColors: true, boxWidth: 10, boxHeight: 10, ...tipFont,
          filter: it => it.raw !== null,
          callbacks: {
            title: it => { const d = serie()[a + it[0].dataIndex]; return modo === "acum" ? (Q ? "4 trimestres al " : "12 meses a ") + d.long : cap(d.long); },
            label: it => it.dataset.label + ": " + (vista.pct ? nf(it.parsed.y, 1) + "%" : fmt(it.parsed.y) + " mill. US$"),
            footer: it => { if (!vista.total) return ""; const d = serie()[a + it[0].dataIndex]; return d ? F[vista.total].nombre + ": " + fmt(d[vista.total]) + " mill. US$" : ""; }
          } }
      }
    },
    plugins: [cross]
  });

  function paint() {
    const al = isDark() ? 0.85 : 0.9;
    chart.data.datasets.forEach(ds => {
      const c = css(F[ds.id].color);
      if (ds.type === "line") {
        ds.borderColor = ds.backgroundColor = ds.pointBackgroundColor = c;
        ds.pointRadius = p => p.dataIndex === b - a ? 4.5 : 0; ds.pointBorderColor = css("--surface"); ds.pointBorderWidth = 2;
        ds.pointHoverRadius = 5; ds.pointHoverBackgroundColor = css("--gold"); ds.pointHoverBorderColor = css("--surface");
      } else if (F[ds.id].signo) {
        // Barra de un saldo: color según sea positivo o negativo
        ds.backgroundColor = ds.data.map(v => rgba(v < 0 ? css("--up") : c, al)); ds.borderColor = "transparent";
      } else { ds.backgroundColor = rgba(c, al); ds.borderColor = "transparent"; }
    });
    const o = chart.options;
    o.scales.x.ticks.color = o.scales.y.ticks.color = css("--muted");
    o.scales.y.grid = { color: c => c.tick && c.tick.value === 0 ? css("--muted") : css("--grid") };
    const tt = o.plugins.tooltip; tt.backgroundColor = css("--ink"); tt.titleColor = tt.bodyColor = tt.footerColor = css("--bg");
  }

  function leyenda() {
    $("legend").innerHTML = vista.barras.map(id => `<span><i class="area-sw" style="background:var(${F[id].color})"></i>${F[id].nombre}${F[id].signo ? " (rojo si es negativo)" : ""}</span>`).join("") +
      vista.lineas.map(id => `<span><i class="line-sw" style="background:var(${F[id].color})"></i>${F[id].nombre}</span>`).join("") +
      "<span>Arrastra las manijas para cambiar el inicio o el fin; arrastra la franja dorada para mover el periodo.</span>";
  }

  function render() {
    const S = serie(), sl = S.slice(a, b + 1), span = b - a;
    const val = (d, id) => {
      if (!d) return null;
      if (!vista.pct) return d[id];
      const t = vista.barras.reduce((s, k) => s + d[k], 0); return t ? d[id] / t * 100 : null;
    };
    chart.data.labels = sl.map((d, i) => base[a + i].lab);
    chart.data.datasets = vista.lineas.map(id => ({ id, type: "line", label: F[id].nombre, data: sl.map(d => val(d, id)), stack: "l-" + id, borderWidth: 2.5, tension: 0.25, cubicInterpolationMode: "monotone", pointHitRadius: 6, order: 0 }))
      .concat(vista.barras.map(id => ({ id, type: "bar", label: F[id].nombre, data: sl.map(d => val(d, id)), stack: "barras", borderRadius: 1, barPercentage: 0.9, categoryPercentage: 0.9, order: 1 })));
    const maxL = Math.max(3, Math.floor((chart.width || 600) / 80)), cand = Q ? [1, 2, 4, 8, 20, 40] : [1, 3, 6, 12, 24, 60, 120];
    const step = cand.find(s => span / s <= maxL) || cand[cand.length - 1];
    chart.options.scales.x.ticks.callback = function (v, i) { const d = base[a + i]; if (!d) return ""; if (step >= P) return d.p === 0 && (d.y % (step / P) === 0) ? String(d.y) : ""; return (d.y * P + d.p) % step === 0 ? d.lab : ""; };
    chart.options.scales.y.ticks.callback = v => vista.pct ? nf(v, 0) + "%" : fmt(v);
    chart.options.scales.y.max = vista.pct ? 100 : undefined;
    paint(); chart.update(drag ? "none" : undefined);
    $("rangeLbl").innerHTML = `<span>Periodo:</span> ${span + 1} ${Q ? "trimestres" : "meses"}`;
    $("unidad").textContent = vista.pct ? "Participación en el total (%)" : modo === "acum" ? (Q ? "Millones de US$, suma de los últimos 4 trimestres" : "Millones de US$, suma de los últimos 12 meses") : (Q ? "Millones de US$ por trimestre" : "Millones de US$ por mes");
    leyenda(); drawMini(); placeBrush();

    const ok = sl.filter(Boolean);
    $("stats").innerHTML = (ok.length ? CFG.resumen(ok, { ...ctx, modo, vista, a, b }) : [["Sin datos", "–", "Amplía el periodo elegido"]])
      .map(([k, v, d]) => `<div class="stat"><div class="k">${k}</div><div class="v num">${v}</div><div class="d">${d}</div></div>`).join("");
    tabla();
  }

  // Tabla anual: suma de cada año (los años incompletos se comparan con los mismos periodos del año anterior)
  const YEARS = [];
  for (let y = base[0].y; y <= base[N - 1].y; y++) {
    const idx = base.map((d, i) => d.y === y ? i : -1).filter(i => i >= 0);
    const n = idx.length, suma = id => idx.reduce((s, i) => s + base[i][id], 0);
    const prev = base.map((d, i) => d.y === y - 1 && d.p < n ? i : -1).filter(i => i >= 0);
    const o = { y, n, i0: idx[0], i1: idx[n - 1], v: {}, pv: prev.length === n ? prev.reduce((s, i) => s + base[i][CFG.tabla[0]], 0) : null };
    IDS.forEach(id => { o.v[id] = suma(id); });
    YEARS.push(o);
  }
  const rangoParcial = Y => Y.n === P ? "" : ` <span class="side">(${Q ? (Y.n === 1 ? "I trim." : "I–" + ROM[Y.n - 1] + " trim.") : (Y.n === 1 ? "ene." : "ene.–" + MES[Y.n - 1].toLowerCase() + ".")})</span>`;
  function tabla() {
    const t0 = CFG.tabla[0];
    const dif = CFG.tablaCambio === "dif";
    $("thead").innerHTML = `<tr><th>Año</th>` + CFG.tabla.map(id => `<th class="r">${nom(id)}</th>`).join("") + `<th class="r">${dif ? "Δ " + nom(t0) : nom(t0) + ": var. %"}</th></tr>`;
    const ys = YEARS.filter(Y => Y.i1 >= a && Y.i0 <= b);
    $("tbody").innerHTML = ys.slice().reverse().map(Y => {
      const vv = Y.pv === null ? null : dif ? Y.v[t0] - Y.pv : Y.pv > 0 ? var_(Y.v[t0], Y.pv) : null;
      const chg = vv === null ? "<span class=\"side\">–</span>" : `<span class="pill ${sube(vv)}">${dif ? sg(vv) : pc(vv)}</span>`;
      return `<tr class="row" data-y="${Y.y}" tabindex="0"><td class="yr">${Y.y}${rangoParcial(Y)}</td>` +
        CFG.tabla.map((id, j) => `<td class="r num">${j === 0 ? "<b>" : ""}<span class="${Y.v[id] < 0 ? "neg" : ""}">${fmt(Y.v[id])}</span>${j === 0 ? "</b>" : ""}</td>`).join("") +
        `<td class="r num">${chg}</td></tr>`;
    }).join("");
  }

  function setChip(id) { document.querySelectorAll("#periodos button").forEach(x => x.setAttribute("aria-pressed", x.id === id ? "true" : "false")); }
  document.querySelectorAll("#periodos button").forEach(btn => btn.addEventListener("click", () => {
    const yv = btn.dataset.y; b = N - 1; a = yv === "all" ? (modo === "acum" ? P - 1 : 0) : Math.max(0, N - P * (+yv)); setChip(btn.id); render();
  }));
  const tb = $("tbody");
  tb.addEventListener("click", e => {
    const tr = e.target.closest("tr.row"); if (!tr) return; const Y = YEARS.find(z => z.y === +tr.dataset.y);
    a = Math.max(0, Y.i0 - P); b = Y.i1; if (b - a < MINSPAN) a = Math.max(0, b - MINSPAN); setChip(""); render();
    document.querySelector(".chartbox").scrollIntoView({ behavior: "smooth", block: "center" });
  });
  tb.addEventListener("keydown", e => { if (e.key === "Enter") e.target.click(); });

  // ---- Selector de periodo arrastrable ----
  const brush = $("brush"), win = $("win"), tagL = $("tagL"), tagR = $("tagR");
  const MINSPAN = Q ? 3 : 6;
  const W = () => brush.clientWidth;
  const xOf = i => i / (N - 1) * W();
  const iOf = x => Math.round(Math.min(Math.max(x / W(), 0), 1) * (N - 1));
  function drawMini() {
    const ca = chart.chartArea; if (!ca) return; const box = chart.canvas.clientWidth;
    brush.style.marginLeft = ca.left + "px"; brush.style.marginRight = Math.max(0, box - ca.right) + "px";
  }
  function placeBrush() {
    const l = xOf(a), r = xOf(b), w = W();
    win.style.left = l + "px"; win.style.width = Math.max(r - l, 2) + "px";
    tagL.textContent = base[a].lab; tagR.textContent = base[b].lab;
    const wl = tagL.offsetWidth, wr = tagR.offsetWidth, gap = 6;
    let xl = l - wl / 2, xr = r - wr / 2;
    const ov = xl + wl + gap - xr; if (ov > 0) { xl -= ov / 2; xr += ov / 2; }
    const pad = -Math.min(24, parseFloat(brush.style.marginLeft) || 0);
    if (xl < pad) { xr += pad - xl; xl = pad; }
    const maxR = w + Math.min(24, parseFloat(brush.style.marginRight) || 0);
    if (xr + wr > maxR) { const d = xr + wr - maxR; xr -= d; if (xl + wl + gap > xr) xl = xr - gap - wl; }
    tagL.style.left = xl + "px"; tagR.style.left = xr + "px";
    $("hL").setAttribute("aria-valuetext", base[a].lab);
    $("hR").setAttribute("aria-valuetext", base[b].lab);
  }
  let raf = 0;
  function schedule() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; render(); }); }
  brush.addEventListener("pointerdown", e => {
    const x = e.clientX - brush.getBoundingClientRect().left, t = e.target;
    if (t.id === "hL") drag = { mode: "l" }; else if (t.id === "hR") drag = { mode: "r" };
    else if (t === win) drag = { mode: "move", off: iOf(x) - a, span: b - a };
    else { const i = iOf(x); if (Math.abs(i - a) < Math.abs(i - b)) { a = Math.max(0, Math.min(i, b - MINSPAN)); drag = { mode: "l" }; } else { b = Math.min(N - 1, Math.max(i, a + MINSPAN)); drag = { mode: "r" }; } }
    brush.setPointerCapture(e.pointerId); setChip(""); schedule(); e.preventDefault();
  });
  brush.addEventListener("pointermove", e => {
    if (!drag) return; const i = iOf(e.clientX - brush.getBoundingClientRect().left);
    if (drag.mode === "l") a = Math.max(0, Math.min(i, b - MINSPAN));
    else if (drag.mode === "r") b = Math.min(N - 1, Math.max(i, a + MINSPAN));
    else { a = Math.min(Math.max(i - drag.off, 0), N - 1 - drag.span); b = a + drag.span; }
    schedule();
  });
  const end = () => { if (drag) { drag = null; render(); } }; brush.addEventListener("pointerup", end); brush.addEventListener("pointercancel", () => { drag = null; });
  function keyH(which) { return e => { const d = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0; if (!d) return; e.preventDefault(); const s = e.shiftKey ? P : 1;
    if (which === "l") a = Math.min(Math.max(0, a + d * s), b - MINSPAN); else b = Math.max(Math.min(N - 1, b + d * s), a + MINSPAN); setChip(""); render(); }; }
  $("hL").addEventListener("keydown", keyH("l"));
  $("hR").addEventListener("keydown", keyH("r"));
  new ResizeObserver(() => { requestAnimationFrame(() => { drawMini(); placeBrush(); }); }).observe(document.querySelector(".chartbox"));
  const repaint = () => { paint(); chart.update("none"); };
  new MutationObserver(repaint).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", repaint);

  const y0 = CFG.periodoInicial || 3;
  a = Math.max(0, N - P * y0); setChip("r" + y0); render();
  $("estadoDatos").textContent = (Q ? "Datos trimestrales de " : "Datos mensuales de ") + base[0].long + " a " + base[N - 1].long + "." +
    (D.vivo ? " Leídos en vivo de BCRPData." : " Copia de BCRPData actualizada el " + D.fecha.split("-").reverse().join("/") + ".");
}
