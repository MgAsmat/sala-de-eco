/* Gráfico interactivo de una serie total (el PBI) y sus componentes, todos en variación porcentual.
   Lo usan pbi-por-sectores.html (mensual) y pbi-gasto.html (trimestral).
   Cada fila de datos trae los componentes en el orden de CFG.comps y el total en la última columna.
   CFG = { freq: "M"|"Q", total: "PBI", comps: [{ nombre, corto }], inicial, unidad, cadaUno, periodoInicial } */
function iniciarComponentes(D, CFG) {
  const Q = CFG.freq === "Q", P = Q ? 4 : 12;
  const MES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const MESL = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const ROM = ["I", "II", "III", "IV"];
  const data = D.filas.map((f, i) => {
    const k = D.inicio[0] * P + D.inicio[1] - 1 + i, y = Math.floor(k / P), p = k % P;
    return { y, p, v: f[f.length - 1], c: f.slice(0, -1), lab: Q ? "T" + (p + 1) + "." + y : MES[p] + "." + y, long: Q ? ROM[p] + " trim. " + y : MESL[p] + " " + y };
  });
  const N = data.length, C = CFG.comps;
  const $ = id => document.getElementById(id);

  const fmt = v => v.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).replace(/[,.]/g, c => c === "," ? " " : ",");
  const sg = v => (v > 0 ? "+" : v < 0 ? "−" : "") + fmt(Math.abs(v));
  const pp = d => (d > 0 ? "+" : d < 0 ? "−" : "±") + fmt(Math.abs(d)) + " pp";
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const rgba = (hex, al) => { const h = hex.replace("#", ""); return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${al})`; };
  const trend = d => Math.abs(d) < 0.05 ? "flat" : d < 0 ? "down" : "up";
  const sube = v => Math.abs(v) < 0.05 ? "flat" : v > 0 ? "pos" : "neg";
  const cap = s => s.replace(/^./, c => c.toUpperCase());
  const isDark = () => document.documentElement.dataset.theme === "dark" || (matchMedia("(prefers-color-scheme: dark)").matches && document.documentElement.dataset.theme !== "light");
  const anim = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 450;

  // Encabezado
  const last = data[N - 1], prev = data[N - 2];
  $("nowVal").innerHTML = sg(last.v) + "<small>%</small>";
  $("nowMeta").innerHTML =
    `${CFG.total} de <b>${last.long}</b><br>${CFG.unidad}<br>` +
    `<span class="pill ${sube(last.v)}">${last.v > 0.05 ? "Creció" : last.v < -0.05 ? "Cayó" : "Sin cambio"}</span> ` +
    `<span class="pill flat">${pp(last.v - prev.v)} vs. ${Q ? "trimestre" : "mes"} anterior</span>`;

  let a = 0, b = N - 1, drag = null, sel = CFG.inicial;

  // Botones para elegir el componente
  $("pick").innerHTML = C.map((c, i) => `<button type="button" data-i="${i}" aria-pressed="${i === sel}">${c.corto || c.nombre}</button>`).join("");
  $("pick").addEventListener("click", e => { const t = e.target.closest("button"); if (t) select(+t.dataset.i); });

  const cross = { id: "cross", afterDatasetsDraw(c) { const t = c.tooltip; if (!t || !t.getActiveElements().length) return; const x = t.getActiveElements()[0].element.x, g = c.ctx; g.save(); g.strokeStyle = css("--gold"); g.lineWidth = 1; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(x, c.chartArea.top); g.lineTo(x, c.chartArea.bottom); g.stroke(); g.restore(); } };
  const ticksY = { font: { family: "Barlow", size: 12 }, callback: v => fmt(v) + "%" };
  const tipFont = { padding: 10, titleFont: { family: "Barlow Condensed", size: 14, weight: "600" }, bodyFont: { family: "Barlow", size: 13 }, footerFont: { family: "Barlow", size: 12, weight: "400" } };

  const chart = new Chart($("chart"), {
    type: "line",
    data: { labels: [], datasets: [
      { label: CFG.total, data: [], borderWidth: 2.75, tension: 0.25, cubicInterpolationMode: "monotone", pointHitRadius: 6 },
      { label: "", data: [], borderWidth: 2, tension: 0.25, cubicInterpolationMode: "monotone", pointHitRadius: 6 }
    ] },
    options: {
      responsive: true, maintainAspectRatio: false, animation: { duration: anim },
      interaction: { mode: "index", intersect: false },
      layout: { padding: { top: 8, right: 8 } },
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { autoSkip: false, maxRotation: 0, font: { family: "Barlow", size: 12 } } },
        y: { border: { display: false }, ticks: ticksY }
      },
      plugins: {
        legend: { display: false },
        tooltip: { displayColors: true, boxWidth: 10, boxHeight: 10, ...tipFont,
          callbacks: {
            title: it => cap(data[a + it[0].dataIndex].long),
            label: it => it.dataset.label + ": " + sg(it.parsed.y) + "%",
            footer: it => { const d = data[a + it[0].dataIndex]; return "Diferencia con el " + CFG.total + ": " + pp(d.c[sel] - d.v); }
          } }
      }
    },
    plugins: [cross]
  });

  // Barras: todos los componentes en un periodo
  const bars = new Chart($("bars"), {
    type: "bar",
    data: { labels: [], datasets: [{ data: [], borderRadius: 3, barPercentage: 0.8, categoryPercentage: 0.9 }] },
    options: {
      indexAxis: "y", responsive: true, maintainAspectRatio: false, animation: { duration: anim },
      layout: { padding: { right: 12 } },
      scales: {
        x: { border: { display: false }, ticks: ticksY },
        y: { grid: { display: false }, border: { display: false }, ticks: { font: { family: "Barlow", size: 13, weight: "600" } } }
      },
      plugins: {
        legend: { display: false },
        tooltip: { displayColors: false, ...tipFont, callbacks: { title: it => it[0].label, label: it => sg(it.parsed.x) + "% en " + data[b].long } }
      },
      onClick: (e, els) => { if (els.length && els[0].index > 0) select(els[0].index - 1); },
      onHover: (e, els) => { e.native.target.style.cursor = els.length && els[0].index > 0 ? "pointer" : "default"; }
    }
  });

  function paint() {
    const [T, S] = chart.data.datasets, s1 = css("--s1"), s2 = css("--s2");
    const lastPt = c => c.dataIndex === b - a ? 4.5 : 0;
    T.borderColor = T.pointBackgroundColor = s1; T.backgroundColor = s1;
    S.borderColor = S.pointBackgroundColor = s2; S.backgroundColor = s2;
    [T, S].forEach(ds => { ds.pointRadius = lastPt; ds.pointBorderColor = css("--surface"); ds.pointBorderWidth = 2; ds.pointHoverRadius = 5; ds.pointHoverBackgroundColor = css("--gold"); ds.pointHoverBorderColor = css("--surface"); });
    [chart, bars].forEach(ch => {
      const o = ch.options;
      o.scales.x.ticks.color = o.scales.y.ticks.color = css("--muted");
      const ax = ch === chart ? o.scales.y : o.scales.x;
      ax.grid = { color: c => c.tick && c.tick.value === 0 ? css("--muted") : css("--grid") };
      const tt = o.plugins.tooltip; tt.backgroundColor = css("--ink"); tt.titleColor = tt.bodyColor = tt.footerColor = css("--bg");
    });
    const bd = bars.data.datasets[0], vals = bd.data;
    bd.backgroundColor = vals.map((v, i) => i === 0 ? css("--gold") : rgba(v < 0 ? css("--up") : css("--teal"), i - 1 === sel ? 1 : 0.55));
    bd.borderColor = vals.map((v, i) => i - 1 === sel ? css("--ink") : "transparent");
    bd.borderWidth = vals.map((v, i) => i - 1 === sel ? 2 : 0);
  }

  function render() {
    const sl = data.slice(a, b + 1), span = b - a, [T, S] = chart.data.datasets, e = sl[sl.length - 1];
    chart.data.labels = sl.map(d => d.lab);
    T.data = sl.map(d => d.v); S.data = sl.map(d => d.c[sel]); S.label = C[sel].nombre;
    // Etiquetas del eje x: tantas como quepan en el ancho del gráfico
    const maxL = Math.max(3, Math.floor((chart.width || 600) / 80)), cand = Q ? [1, 2, 4, 8, 20, 40] : [1, 3, 6, 12, 24, 60, 120];
    const step = cand.find(s => span / s <= maxL) || cand[cand.length - 1];
    chart.options.scales.x.ticks.callback = function (v, i) { const d = sl[i]; if (step >= P) return d.p === 0 && (d.y % (step / P) === 0) ? String(d.y) : ""; return (d.y * P + d.p) % step === 0 ? d.lab : ""; };
    bars.data.labels = [CFG.total].concat(C.map(c => c.corto || c.nombre));
    bars.data.datasets[0].data = [e.v].concat(e.c);
    paint(); chart.update(drag ? "none" : undefined); bars.update(drag ? "none" : undefined);
    $("rangeLbl").innerHTML = `<span>Periodo:</span> ${b - a + 1} ${Q ? "trimestres" : "meses"}`;
    $("barsTitle").textContent = `Así le fue a cada ${CFG.cadaUno} en ${e.long}`;
    $("lgSel").textContent = C[sel].nombre;
    drawMini(); placeBrush();

    const avg = arr => arr.reduce((s, x) => s + x, 0) / arr.length;
    const mT = avg(sl.map(d => d.v)), mS = avg(sl.map(d => d.c[sel]));
    let best = 0, worst = 0; e.c.forEach((v, i) => { if (v > e.c[best]) best = i; if (v < e.c[worst]) worst = i; });
    $("stats").innerHTML = [
      [CFG.total + " al cierre", sg(e.v) + "%", e.lab + " · promedio del periodo " + sg(mT) + "%"],
      [C[sel].nombre, sg(e.c[sel]) + "%", e.lab + " · promedio del periodo " + sg(mS) + "%"],
      ["Creció más", sg(e.c[best]) + "%", C[best].nombre + " · " + e.lab],
      [e.c[worst] < 0 ? "Cayó más" : "Creció menos", sg(e.c[worst]) + "%", C[worst].nombre + " · " + e.lab]
    ].map(([k, v, d]) => `<div class="stat"><div class="k">${k}</div><div class="v num">${v}</div><div class="d">${d}</div></div>`).join("");

    $("thead").innerHTML = `<tr><th>${Q ? "Trimestre" : "Mes"}</th><th class="r">${CFG.total}</th>` + C.map((c, i) => `<th class="r${i === sel ? " sel" : ""}">${c.corto || c.nombre}</th>`).join("") + "</tr>";
    $("tbody").innerHTML = sl.slice().reverse().map((d, k) => {
      const i = b - k, cell = v => `<span class="${v < 0 ? "neg" : ""}">${sg(v)}</span>`;
      return `<tr class="row${i === b ? " on" : ""}" data-i="${i}" tabindex="0"><td>${cap(d.long)}</td><td class="r num"><b>${cell(d.v)}</b></td>` + d.c.map((v, j) => `<td class="r num${j === sel ? " sel" : ""}">${cell(v)}</td>`).join("") + "</tr>";
    }).join("");
  }

  function select(i) {
    sel = i;
    $("pick").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", +x.dataset.i === i ? "true" : "false"));
    render();
  }

  function setChip(id) { document.querySelectorAll("#periodos button").forEach(x => x.setAttribute("aria-pressed", x.id === id ? "true" : "false")); }
  document.querySelectorAll("#periodos button").forEach(btn => btn.addEventListener("click", () => {
    const yv = btn.dataset.y; b = N - 1; a = yv === "all" ? 0 : Math.max(0, N - P * (+yv)); setChip(btn.id); render();
  }));
  // Clic en una fila de la tabla: las barras muestran ese periodo
  const tb = $("tbody");
  tb.addEventListener("click", e => {
    const tr = e.target.closest("tr.row"); if (!tr) return; const i = +tr.dataset.i;
    const span = b - a; b = i; a = Math.max(0, b - span); if (b - a < MINSPAN) b = Math.min(N - 1, a + MINSPAN); setChip(""); render();
    $("bars").scrollIntoView({ behavior: "smooth", block: "center" });
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
    tagL.textContent = data[a].lab; tagR.textContent = data[b].lab;
    const wl = tagL.offsetWidth, wr = tagR.offsetWidth, gap = 6;
    let xl = l - wl / 2, xr = r - wr / 2;
    const ov = xl + wl + gap - xr; if (ov > 0) { xl -= ov / 2; xr += ov / 2; }
    const pad = -Math.min(24, parseFloat(brush.style.marginLeft) || 0);
    if (xl < pad) { xr += pad - xl; xl = pad; }
    const maxR = w + Math.min(24, parseFloat(brush.style.marginRight) || 0);
    if (xr + wr > maxR) { const d = xr + wr - maxR; xr -= d; if (xl + wl + gap > xr) xl = xr - gap - wl; }
    tagL.style.left = xl + "px"; tagR.style.left = xr + "px";
    $("hL").setAttribute("aria-valuetext", data[a].lab);
    $("hR").setAttribute("aria-valuetext", data[b].lab);
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
  const end = () => { drag = null; render(); }; brush.addEventListener("pointerup", end); brush.addEventListener("pointercancel", () => { drag = null; });
  function keyH(which) { return e => { const d = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0; if (!d) return; e.preventDefault(); const s = e.shiftKey ? P : 1;
    if (which === "l") a = Math.min(Math.max(0, a + d * s), b - MINSPAN); else b = Math.max(Math.min(N - 1, b + d * s), a + MINSPAN); setChip(""); render(); }; }
  $("hL").addEventListener("keydown", keyH("l"));
  $("hR").addEventListener("keydown", keyH("r"));
  new ResizeObserver(() => { requestAnimationFrame(() => { drawMini(); placeBrush(); }); }).observe(document.querySelector(".chartbox"));
  const repaint = () => { paint(); chart.update("none"); bars.update("none"); };
  new MutationObserver(repaint).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", repaint);

  const y0 = CFG.periodoInicial || 3;
  a = Math.max(0, N - P * y0); setChip("r" + y0); render();
  $("estadoDatos").textContent = (Q ? "Datos trimestrales de " : "Datos mensuales de ") + data[0].long + " a " + data[N - 1].long + "." +
    (D.vivo ? " Leídos en vivo de BCRPData." : " Copia de BCRPData actualizada el " + D.fecha.split("-").reverse().join("/") + ".");
}
