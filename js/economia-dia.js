/* Economía en mi día: diagrama interactivo del flujo circular, recorrido guiado y quiz */
(function(){
"use strict";
if (!document.getElementById("diagram")) return;
var NS = "http://www.w3.org/2000/svg";

/* ---------- Data ---------- */
var NODES = {
  familias:  {kind:"agente",  x:140, y:370, r:60, name:"Familias"},
  empresas:  {kind:"agente",  x:860, y:370, r:60, name:"Empresas"},
  gobierno:  {kind:"agente",  x:500, y:282, r:52, name:"Gobierno"},
  mundo:     {kind:"agente",  x:880, y:88,  r:44, name:"Resto del mundo", below:true},
  bienes:    {kind:"mercado", x:500, y:90,  w:236, h:62, name:"Bienes y servicios"},
  trabajo:   {kind:"mercado", x:500, y:640, w:236, h:62, name:"Trabajo"},
  financiero:{kind:"mercado", x:500, y:470, w:220, h:62, name:"Financiero", noDe:true}
};

var FLOWS = [
  {id:"f_gasto",   from:"familias", to:"bienes",   k:"dinero", label:"Gasto en consumo",      d:"M112 314 C112 170 240 70 380 72"},
  {id:"f_bienes",  from:"bienes",   to:"familias", k:"real",   label:"Bienes y servicios",    d:"M382 110 C270 118 176 196 166 312"},
  {id:"e_oferta",  from:"empresas", to:"bienes",   k:"real",   label:"Bienes producidos",     d:"M888 314 C888 170 760 70 620 72"},
  {id:"e_insumos", from:"bienes",   to:"empresas", k:"real",   label:"Insumos",               d:"M620 90 C748 94 858 184 861 308", lt:.3},
  {id:"e_ventas",  from:"bienes",   to:"empresas", k:"dinero", label:"Ingresos por ventas",   d:"M618 112 C730 120 822 198 832 314", lt:.6},
  {id:"f_trabajo", from:"familias", to:"trabajo",  k:"real",   label:"Trabajo",               d:"M112 426 C112 570 240 666 380 660"},
  {id:"f_salario", from:"trabajo",  to:"familias", k:"dinero", label:"Remuneraciones",        d:"M382 624 C270 616 176 540 166 428"},
  {id:"e_trabajo", from:"trabajo",  to:"empresas", k:"real",   label:"Trabajadores",          d:"M620 660 C760 666 888 570 888 426"},
  {id:"e_salario", from:"empresas", to:"trabajo",  k:"dinero", label:"Remuneraciones",        d:"M834 428 C824 540 730 616 618 624"},
  {id:"f_imp",     from:"familias", to:"gobierno", k:"dinero", label:"Impuestos",             d:"M198 346 C280 300 360 262 444 268"},
  {id:"g_transf",  from:"gobierno", to:"familias", k:"dinero", label:"Transferencias",        d:"M450 300 C370 318 290 352 200 376"},
  {id:"e_imp",     from:"empresas", to:"gobierno", k:"dinero", label:"Impuestos",             d:"M802 346 C720 300 640 262 556 268"},
  {id:"g_ahorro",  from:"gobierno", to:"financiero", k:"dinero", label:"Ahorro",              d:"M486 336 L486 434", lx:-36},
  {id:"mf_cred_g", from:"financiero", to:"gobierno", k:"dinero", label:"Crédito",             d:"M514 436 L514 338", lx:36},
  {id:"f_ahorro",  from:"familias", to:"financiero", k:"dinero", label:"Ahorro",              d:"M188 406 C250 440 320 458 384 460"},
  {id:"mf_cred_f", from:"financiero", to:"familias", k:"dinero", label:"Crédito",            d:"M390 490 C310 500 230 478 176 424"},
  {id:"mf_prest",  from:"financiero", to:"empresas", k:"dinero", label:"Crédito",            d:"M612 462 C690 458 760 440 812 406"},
  {id:"e_ahorro",  from:"empresas", to:"financiero", k:"dinero", label:"Ahorro",             d:"M826 426 C780 480 700 500 614 490"},
  {id:"exp",       from:"bienes",   to:"mundo",    k:"real",   label:"Exportaciones",         d:"M620 76 C700 44 780 40 834 70"},
  {id:"imp",       from:"mundo",    to:"bienes",   k:"real",   label:"Importaciones",         d:"M834 108 C780 138 700 136 620 104"}
];

var INFO = {
  familias:{
    lede:"Las familias son la base de la sociedad. Reciben ingresos trabajando en las empresas o en sus propios negocios, dinero que utilizan en la compra de diversos bienes y servicios como alimentos, transporte, educación y salud, y en el pago de impuestos. Lo que no gastan, lo ahorran o pagan préstamos.",
    ej:"Rosa trabaja en una panadería. Con su remuneración paga el pasaje, compra útiles para sus hijos y ahorra una parte cada mes en una caja municipal.",
    dato:"Las familias también interactúan con las instituciones financieras: ahorran, solicitan créditos y los pagan."
  },
  empresas:{
    lede:"Las empresas producen diversos bienes y servicios que consumimos cada día. Por ejemplo, los alimentos, el servicio de transporte, la educación y el entretenimiento.",
    ej:"Una panadería compra harina como insumo, contrata a tres panaderos y vende pan cada mañana. Con un crédito compra un horno nuevo y produce más.",
    dato:"Para producir, las empresas contratan personas en el mercado de trabajo, compran insumos, pagan impuestos y ahorran o piden créditos en el mercado financiero."
  },
  gobierno:{
    lede:"El Gobierno recibe ingresos principalmente a través de los impuestos que pagan las personas y las empresas, y utiliza estos recursos para proveer servicios públicos como seguridad, salud, educación e infraestructura: carreteras, puentes, hospitales y colegios, entre otros.",
    ej:"Los impuestos que pagan Rosa y la panadería ayudan a financiar el colegio público de su barrio, la posta médica y la pista por la que pasa su micro.",
    dato:"El Gobierno también realiza transferencias a las familias, contrata trabajadores en el mercado laboral y, como las personas y las empresas, ahorra y pide créditos en el mercado financiero."
  },
  mundo:{
    lede:"En un mundo globalizado, nuestra relación con el resto del mundo es cada vez más activa: compramos y vendemos productos y servicios del y al exterior.",
    ej:"Exportamos uvas, espárragos, paltas, minerales como oro, cobre y zinc, y prendas de vestir. Importamos celulares, televisores, microondas y carros, entre otros.",
    dato:"El comercio internacional nos permite vender más y tener mayor diversidad de productos. El resto del mundo también nos brinda recursos financieros y oportunidades de ahorro e inversión."
  },
  bienes:{
    lede:"En el mercado de bienes y servicios las personas, las empresas y el Gobierno interactúan y compran y venden bienes como alimentos, ropa, electrodomésticos o cemento, y también servicios como transporte, educación, salud y entretenimiento.",
    ej:"El mercado del barrio, una ferretería que vende cemento o una empresa de transporte: donde se compra y se vende algo, hay un mercado de bienes y servicios.",
    dato:"Cuando se venden bienes o servicios al exterior se denominan exportaciones, y cuando se compran del exterior, importaciones."
  },
  trabajo:{
    lede:"En el mercado laboral, las personas ofrecen su trabajo, sus habilidades y sus conocimientos a las empresas y al Gobierno, a cambio de lo cual reciben una remuneración.",
    ej:"Una enfermera recién egresada postula a un hospital; el hospital la contrata y le paga una remuneración mensual.",
    dato:"Las empresas y el Gobierno necesitan contratar personas para poder producir los bienes y servicios que ofrecen a la sociedad."
  },
  financiero:{
    lede:"En el mercado financiero, las personas, las empresas y el Gobierno depositan sus excedentes de dinero y también pueden solicitar préstamos.",
    ej:"Entre las principales instituciones financieras se encuentran los bancos, las financieras, las cajas municipales y rurales, y las Edpymes.",
    dato:"Estas transacciones de ahorro, inversión y crédito también se realizan con entidades financieras del exterior."
  }
};

var TOUR = [
  {t:"Rosa ofrece su trabajo", flows:["f_trabajo","e_trabajo"], txt:"Rosa trabaja en una panadería. En el mercado de trabajo ofrece su tiempo, sus habilidades y sus conocimientos a la empresa."},
  {t:"Recibe su remuneración", flows:["e_salario","f_salario"], txt:"A fin de mes, la panadería le paga su remuneración. Así el dinero pasa de la empresa a la familia."},
  {t:"Sale de compras", flows:["f_gasto","f_bienes","e_ventas"], txt:"Rosa compra alimentos, útiles y paga el pasaje. Su gasto se convierte en los ingresos por ventas de muchas empresas."},
  {t:"La panadería produce", flows:["e_insumos","e_oferta"], txt:"Con esos ingresos, la panadería compra insumos como harina y levadura, y vuelve a ofrecer pan en el mercado de bienes y servicios."},
  {t:"Productos del y al exterior", flows:["imp","exp"], txt:"Rosa compra un celular importado. Al mismo tiempo, empresas peruanas exportan uvas, paltas, espárragos y cobre al resto del mundo."},
  {t:"Impuestos y transferencias", flows:["f_imp","e_imp","g_transf"], txt:"Rosa y la panadería pagan impuestos. Con esos recursos el Gobierno ofrece seguridad, salud, educación e infraestructura, y realiza transferencias a las familias."},
  {t:"Ahorro y crédito", flows:["f_ahorro","e_ahorro","g_ahorro","mf_prest","mf_cred_f","mf_cred_g"], txt:"Lo que no gastan, familias, empresas y Gobierno lo depositan en el mercado financiero. Esos ahorros permiten dar créditos: la panadería pide uno para comprar un horno nuevo."},
  {t:"El circuito vuelve a empezar", flows:"all", txt:"Con el nuevo horno, la panadería produce más y contrata a otra persona. Más ingresos, más consumo, más producción: la economía sigue girando."}
];

var QUIZ = [
  {q:"¿Qué reciben las personas a cambio de ofrecer su trabajo?", o:["Una remuneración","Impuestos","Importaciones"], a:0, fb:"Correcto: en el mercado laboral, las personas reciben una remuneración por su trabajo."},
  {q:"¿Dónde depositan sus excedentes de dinero las personas, las empresas y el Gobierno?", o:["En el mercado de trabajo","En el mercado financiero","En el mercado de bienes y servicios"], a:1, fb:"En el mercado financiero se deposita el dinero que sobra y se solicitan préstamos."},
  {q:"Cuando el Perú vende paltas a otro país, se trata de…", o:["Una importación","Una transferencia","Una exportación"], a:2, fb:"Vender bienes o servicios al exterior se denomina exportación."},
  {q:"¿De dónde obtiene el Gobierno sus ingresos principalmente?", o:["De los impuestos","De las importaciones","De las remuneraciones que paga"], a:0, fb:"Los impuestos de personas y empresas financian seguridad, salud, educación e infraestructura."},
  {q:"¿Cuál de estas es una institución del mercado financiero?", o:["Una caja municipal","Una fábrica de cemento","Un colegio público"], a:0, fb:"Bancos, financieras, cajas municipales y rurales y Edpymes forman parte del mercado financiero."}
];

/* ---------- Helpers ---------- */
function el(tag, attrs, parent){
  var e = document.createElementNS(NS, tag);
  for (var k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
function $(s){ return document.querySelector(s); }
function $all(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); }

var svg = $("#diagram"), gFlows = $("#g-flows"), gPts = $("#g-pts"), gNodes = $("#g-nodes"), gLabels = $("#g-labels");
var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

var state = { sel:"familias", filter:"todos", mode:"explorar", step:0, playing:!reduce };

/* ---------- Build flows ---------- */
FLOWS.forEach(function(f){
  f.path = el("path", {d:f.d, "class":"flow "+f.k, "marker-end":"url(#ar-"+f.k+")"}, gFlows);
  f.hit = el("path", {d:f.d, "class":"flow-hit"}, gFlows);
  f.len = f.path.getTotalLength();
  f.pts = [];
  var n = Math.max(2, Math.round(f.len/110));
  for (var i=0;i<n;i++){
    var p = f.k==="dinero" ? el("circle",{r:5.5,"class":"pt dinero"},gPts) : el("rect",{width:9,height:9,x:-4.5,y:-4.5,"class":"pt real"},gPts);
    f.pts.push({e:p, o:i/n});
  }
  // label
  var mid = f.path.getPointAtLength(f.len*(f.lt||0.5));
  mid = {x:mid.x+(f.lx||0), y:mid.y};
  var g = el("g", {"class":"flabel "+f.k}, gLabels);
  var r = el("rect", {rx:11, ry:11}, g);
  var tx = el("text", {x:mid.x, y:mid.y+4.3, "text-anchor":"middle"}, g);
  tx.textContent = f.label;
  f.label_g = g; f.label_r = r; f.mid = mid;
  f.hit.addEventListener("mouseenter", function(){ g.classList.add("show"); sizeLabels(); });
  f.hit.addEventListener("mouseleave", function(){ if(!f.path.classList.contains("on") || !svg.classList.contains("is-focus")) g.classList.remove("show"); else refresh(); });
});
// size label pills once fonts are ready
// Ubica las etiquetas visibles evitando que se superpongan entre sí o con los nombres de los nodos
var VB = svg.viewBox.baseVal;
function sizeLabels(){
  var fs = 12.5, h = fs*1.76, gap = 6;
  var shown = FLOWS.filter(function(f){ return f.label_g.classList.contains("show"); });
  var boxes = FLOWS.map(function(f){
    var tx = f.label_g.querySelector("text");
    tx.setAttribute("x", f.mid.x);
    var w = tx.getBBox().width + fs*1.6;
    return {f:f, x:f.mid.x, y:f.mid.y, w:w, h:h, on:shown.indexOf(f) > -1};
  });
  var obst = [];
  Object.keys(NODES).forEach(function(id){
    $all('[data-id="'+id+'"] text').forEach(function(t){
      var b = t.getBBox(); obst.push({x:b.x+b.width/2, y:b.y+b.height/2, w:b.width, h:b.height});
    });
  });
  var act = boxes.filter(function(b){ return b.on; });
  function push(a, b, move){ // mueve "a" (y "b" si se puede) hasta que dejen de tocarse
    var ox = (a.w+b.w)/2 + gap - Math.abs(a.x-b.x), oy = (a.h+b.h)/2 + gap - Math.abs(a.y-b.y);
    if (ox <= 0 || oy <= 0) return false;
    var sy = a.y < b.y || (a.y===b.y && a.f && b.f && a.f.mid.y <= b.f.mid.y) ? -1 : 1;
    if (oy < ox*1.5){ a.y += sy*oy*(move?.5:1); if (move) b.y -= sy*oy*.5; }
    else { var sx = a.x < b.x ? -1 : 1; a.x += sx*ox*(move?.5:1); if (move) b.x -= sx*ox*.5; }
    return true;
  }
  for (var it=0; it<60; it++){
    var moved = false;
    for (var i=0;i<act.length;i++){
      for (var j=i+1;j<act.length;j++) moved = push(act[i], act[j], true) || moved;
      for (var o=0;o<obst.length;o++) moved = push(act[i], obst[o], false) || moved;
      var a = act[i];
      a.x = Math.max(VB.x + a.w/2 + 4, Math.min(VB.x + VB.width - a.w/2 - 4, a.x));
      a.y = Math.max(VB.y + a.h/2 + 4, Math.min(VB.y + VB.height - a.h/2 - 4, a.y));
    }
    if (!moved) break;
  }
  boxes.forEach(function(b){
    var tx = b.f.label_g.querySelector("text");
    tx.setAttribute("x", b.x); tx.setAttribute("y", b.y + fs*.35);
    b.f.label_r.setAttribute("x", b.x - b.w/2);
    b.f.label_r.setAttribute("y", b.y - b.h/2);
    b.f.label_r.setAttribute("width", b.w);
    b.f.label_r.setAttribute("height", b.h);
    b.f.label_r.setAttribute("rx", b.h/2); b.f.label_r.setAttribute("ry", b.h/2);
  });
}
if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ sizeLabels(); });

/* ---------- Build nodes ---------- */
Object.keys(NODES).forEach(function(id){
  var n = NODES[id];
  var g = el("g", {"class":"node "+n.kind, tabindex:0, role:"button", "aria-label":nodeTitle(id), "data-id":id}, gNodes);
  if (n.kind === "agente"){
    el("circle", {cx:n.x, cy:n.y, r:n.r, "class":"ring"}, g);
    el("circle", {cx:n.x, cy:n.y, r:n.r, "class":"shape"}, g);
    var s = n.below ? 34 : 30;
    el("use", {href:"#i-"+id, x:n.x-s/2, y:n.below ? n.y-s/2 : n.y-s/2-12, width:s, height:s, "class":"ic"}, g);
    var t = el("text", {x:n.x, y:n.below ? n.y+n.r+22 : n.y+24, "class":"nm"}, g);
    t.textContent = n.name;
    if (!n.below && n.name.length > 8) t.setAttribute("font-size","12");
  } else {
    el("rect", {x:n.x-n.w/2, y:n.y-n.h/2, width:n.w, height:n.h, rx:n.h/2, "class":"ring"}, g);
    el("rect", {x:n.x-n.w/2, y:n.y-n.h/2, width:n.w, height:n.h, rx:n.h/2, "class":"shape"}, g);
    el("use", {href:"#i-"+id, x:n.x-n.w/2+18, y:n.y-13, width:26, height:26, "class":"ic"}, g);
    var k = el("text", {x:n.x+14, y:n.y-6, "class":"kicker"}, g); k.textContent = n.noDe ? "MERCADO" : "MERCADO DE";
    var t2 = el("text", {x:n.x+14, y:n.y+14, "class":"nm"}, g); t2.textContent = n.name;
  }
  n.g = g;
  g.addEventListener("click", function(){ select(id); });
  g.addEventListener("keydown", function(e){ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); select(id); } });
});

/* ---------- Highlight logic ---------- */
function activeFlowIds(){
  if (state.mode === "recorrido"){
    var s = TOUR[state.step];
    return s.flows === "all" ? null : s.flows;
  }
  if (!state.sel) return null;
  return FLOWS.filter(function(f){ return f.from===state.sel || f.to===state.sel; }).map(function(f){ return f.id; });
}
function refresh(){
  var ids = activeFlowIds();
  var focus = !!ids;
  svg.classList.toggle("is-focus", focus);
  var onNodes = {};
  FLOWS.forEach(function(f){
    var hidden = state.filter !== "todos" && state.filter !== f.k;
    var on = !focus || ids.indexOf(f.id) > -1;
    f.path.classList.toggle("off", hidden); f.hit.classList.toggle("off", hidden);
    f.path.classList.toggle("on", on);
    f.pts.forEach(function(p){ p.e.classList.toggle("on", on); p.e.classList.toggle("off", hidden); });
    f.label_g.classList.toggle("show", focus && on && !hidden);
    if (on && !hidden){ onNodes[f.from]=1; onNodes[f.to]=1; }
  });
  if (state.mode==="explorar" && state.sel) onNodes[state.sel]=1;
  Object.keys(NODES).forEach(function(id){
    var n = NODES[id];
    n.g.classList.toggle("on", !!onNodes[id]);
    n.g.classList.toggle("sel", state.mode==="explorar" && state.sel===id);
  });
  $("#hint-name").textContent = state.mode==="recorrido" ? "Paso "+(state.step+1)+" de "+TOUR.length
    : state.sel ? nodeTitle(state.sel) : "Todo el circuito";
  sizeLabels();
}

/* ---------- Panel rendering ---------- */
var pane = $("#pane");
function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]; }); }
function nodeTitle(id){ var n=NODES[id]; return n.kind==="mercado" ? "Mercado "+(n.noDe?"":"de ")+n.name.toLowerCase() : n.name; }

function renderExplorar(){
  if (!state.sel){
    pane.innerHTML = '<div class="pane-anim"><span class="tag">Vista general</span><h2>Todo el circuito</h2>'+
      '<p class="lede">Estás viendo los '+FLOWS.length+' flujos a la vez. Los rombos representan bienes, servicios y trabajo; las monedas, los pagos en soles. Elige un agente o un mercado para ver solo sus conexiones.</p>'+
      '<div class="box"><b>Idea clave</b><p>Lo que para uno es un gasto, para otro es un ingreso. Por eso el flujo es circular.</p></div></div>';
    return;
  }
  var n = NODES[state.sel], info = INFO[state.sel];
  var rel = FLOWS.filter(function(f){ return f.from===state.sel || f.to===state.sel; });
  var items = rel.map(function(f){
    var out = f.from===state.sel;
    var other = out ? f.to : f.from;
    var mark = f.k==="dinero" ? '<span class="dot"></span>' : '<span class="sq"></span>';
    return '<li data-flow="'+f.id+'">'+mark+'<span><b>'+esc(f.label)+'</b> <span class="dir">'+(out?'→ entrega a ':'← recibe de ')+esc(nodeTitle(other).replace(/^Mercado /,"m. "))+'</span></span></li>';
  }).join("");
  pane.innerHTML = '<div class="pane-anim">'+
    '<span class="tag '+(n.kind==="mercado"?"m":"a")+'">'+(n.kind==="mercado"?"Mercado":"Agente económico")+'</span>'+
    '<h2>'+esc(nodeTitle(state.sel))+'</h2>'+
    '<p class="lede">'+esc(info.lede)+'</p>'+
    '<ul class="flows-list">'+items+'</ul>'+
    '<div class="box"><b>En la vida diaria</b><p>'+esc(info.ej)+'</p></div>'+
    '<div class="box" style="border-style:solid;background:var(--ed-surface-2)"><b>¿Sabías que…?</b><p>'+esc(info.dato)+'</p></div>'+
  '</div>';
  $all(".flows-list li").forEach(function(li){
    var f = FLOWS.filter(function(x){ return x.id===li.dataset.flow; })[0];
    li.addEventListener("mouseenter", function(){ f.path.style.strokeWidth = "6"; });
    li.addEventListener("mouseleave", function(){ f.path.style.strokeWidth = ""; });
  });
}

function renderRecorrido(){
  var s = TOUR[state.step];
  var bars = TOUR.map(function(_,i){ return '<i class="'+(i<=state.step?"done":"")+'"></i>'; }).join("");
  pane.innerHTML = '<div class="pane-anim">'+
    '<div style="display:flex;align-items:center;gap:14px"><span class="coin" aria-hidden="true">S/</span><div><span class="step-no">PASO '+(state.step+1)+' / '+TOUR.length+'</span><div class="steps-bar">'+bars+'</div></div></div>'+
    '<h2 style="margin-top:18px">'+esc(s.t)+'</h2>'+
    '<p class="lede">'+esc(s.txt)+'</p>'+
    '<div class="tour-nav"><button class="ed-btn ghost" id="prev" '+(state.step===0?"disabled":"")+'>Anterior</button>'+
    '<button class="ed-btn" id="next">'+(state.step===TOUR.length-1?"Volver al inicio":"Siguiente")+'</button></div>'+
  '</div>';
  $("#prev").addEventListener("click", function(){ go(state.step-1); });
  $("#next").addEventListener("click", function(){ go(state.step===TOUR.length-1 ? 0 : state.step+1); });
}
function go(i){ state.step = Math.max(0, Math.min(TOUR.length-1, i)); renderRecorrido(); refresh(); }

function render(){ state.mode==="explorar" ? renderExplorar() : renderRecorrido(); refresh(); }

function setMode(m){
  state.mode = m;
  $("#tab-explorar").setAttribute("aria-selected", m==="explorar");
  $("#tab-recorrido").setAttribute("aria-selected", m==="recorrido");
  render();
}
function select(id){
  state.sel = id;
  if (state.mode !== "explorar"){ state.mode = "explorar"; $("#tab-explorar").setAttribute("aria-selected",true); $("#tab-recorrido").setAttribute("aria-selected",false); }
  render();
}

$("#tab-explorar").addEventListener("click", function(){ setMode("explorar"); });
$("#tab-recorrido").addEventListener("click", function(){ setMode("recorrido"); });
var explorer = $("#explorar");
function setFull(on){
  explorer.classList.toggle("is-full", on);
  document.body.classList.toggle("ed-no-scroll", on);
  $("#btn-full").setAttribute("aria-pressed", on);
  $("#full-txt").textContent = on ? "Reducir" : "Ampliar";
  $("#full-ico").setAttribute("d", on ? "M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" : "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5");
}
$("#btn-full").addEventListener("click", function(){ setFull(!explorer.classList.contains("is-full")); });
document.addEventListener("keydown", function(e){ if (e.key==="Escape" && explorer.classList.contains("is-full")) setFull(false); });
$("#btn-all").addEventListener("click", function(){ state.sel = null; setMode("explorar"); });
$all(".ecodia .chip").forEach(function(c){
  c.addEventListener("click", function(){
    state.filter = c.dataset.filter;
    $all(".ecodia .chip").forEach(function(x){ x.setAttribute("aria-pressed", x===c); });
    refresh();
  });
});

/* ---------- Agent cards ---------- */
var agents = $("#agents");
["familias","empresas","gobierno","mundo","bienes","trabajo","financiero"].forEach(function(id){
  var n = NODES[id];
  var b = document.createElement("button");
  b.className = "agent-btn" + (n.kind==="mercado" ? " mk" : "");
  b.innerHTML = '<span class="ico"><svg aria-hidden="true"><use href="#i-'+id+'"/></svg></span><span><b>'+esc(nodeTitle(id))+'</b><small>'+(n.kind==="mercado"?"Mercado":"Agente económico")+'</small></span>';
  b.addEventListener("click", function(){
    select(id);
    $("#explorar").scrollIntoView({behavior: reduce ? "auto" : "smooth", block:"start"});
  });
  agents.appendChild(b);
});

/* ---------- Animation ---------- */
var SPEED = 70; // px per second
var last = 0, clock = 0;
function place(){
  FLOWS.forEach(function(f){
    f.pts.forEach(function(p){
      var t = ((p.o + clock*SPEED/f.len) % 1);
      var pt = f.path.getPointAtLength(t*f.len);
      if (p.e.tagName === "circle"){ p.e.setAttribute("cx", pt.x); p.e.setAttribute("cy", pt.y); }
      else p.e.setAttribute("transform", "translate("+pt.x+" "+pt.y+") rotate(45)");
    });
  });
}
function frame(ts){
  if (last) clock += Math.min(0.05, (ts-last)/1000);
  last = ts;
  place();
  if (state.playing) requestAnimationFrame(frame); else last = 0;
}
function setPlaying(p){
  state.playing = p;
  $("#btn-play").setAttribute("aria-pressed", p);
  $("#play-txt").textContent = p ? "Pausar" : "Animar";
  $("#play-ico").setAttribute("d", p ? "M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" : "M8 5v14l11-7z");
  if (p) requestAnimationFrame(frame);
}
$("#btn-play").addEventListener("click", function(){ setPlaying(!state.playing); });
place();
setPlaying(state.playing);
document.addEventListener("visibilitychange", function(){ if (document.hidden && state.playing){ state._resume = true; state.playing = false; } else if (!document.hidden && state._resume){ state._resume = false; setPlaying(true); } });

/* ---------- Quiz ---------- */
var qWrap = $("#questions"), score = 0;
function buildQuiz(){
  score = 0; $("#score").textContent = "0";
  qWrap.innerHTML = "";
  QUIZ.forEach(function(item, qi){
    var d = document.createElement("div"); d.className = "q";
    d.innerHTML = '<p>'+(qi+1)+'. '+esc(item.q)+'</p><div class="opts"></div><div class="fb" hidden></div>';
    var opts = d.querySelector(".opts"), fb = d.querySelector(".fb");
    item.o.forEach(function(txt, oi){
      var b = document.createElement("button"); b.className = "opt"; b.textContent = txt; b.id = "q"+qi+"o"+oi;
      b.addEventListener("click", function(){
        $all("#questions .q:nth-child("+(qi+1)+") .opt").forEach(function(x, xi){
          x.disabled = true;
          if (xi===item.a) x.classList.add("ok");
        });
        if (oi===item.a){ score++; $("#score").textContent = score; fb.textContent = "✓ "+item.fb; }
        else { b.classList.add("no"); fb.textContent = "La respuesta es “"+item.o[item.a]+"”. "+item.fb.replace(/^Correcto: /,""); }
        fb.hidden = false;
      });
      opts.appendChild(b);
    });
    qWrap.appendChild(d);
  });
}
buildQuiz();
$("#quiz-reset").addEventListener("click", buildQuiz);

render();
})();
