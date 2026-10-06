(() => {
  const header = document.getElementById("siteHeader");
  const navToggle = document.getElementById("navToggle");
  const primaryNav = document.getElementById("primaryNav");
  const navLinks = document.querySelectorAll(".nav-link");
  const backToTop = document.getElementById("backToTop");
  const suggestForm = document.getElementById("suggestForm");
  const formSuccess = document.getElementById("formSuccess");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Mobile nav toggle
  navToggle.addEventListener("click", () => {
    const isOpen = primaryNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación");
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      primaryNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  // Sticky header + back-to-top visibility
  const onScroll = () => {
    const scrolled = window.scrollY > 12;
    header.classList.toggle("is-scrolled", scrolled);
    backToTop.classList.toggle("is-visible", window.scrollY > 480);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Highlight the nav link matching the current page (Sector Real/Externo/Financiero each highlight their own item)
  const currentPage = location.pathname.split("/").pop() || "index.html";
  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    link.classList.toggle("active", href === currentPage);
  });

  // Dato curioso: tip carousel(s) — each instance reads its own tips from an embedded JSON block
  Array.from(document.querySelectorAll(".tip-carousel")).forEach((tipCarousel) => {
    const dataEl = tipCarousel.querySelector(".tip-carousel__data");
    let tips = [];
    try {
      tips = dataEl ? JSON.parse(dataEl.textContent) : [];
    } catch (e) {
      tips = [];
    }
    if (!tips.length) return;

    const tipText = tipCarousel.querySelector(".tip-carousel__text");
    const tipDots = tipCarousel.querySelector(".tip-carousel__dots");
    const tipPrev = tipCarousel.querySelector(".tip-carousel__btn--prev");
    const tipNext = tipCarousel.querySelector(".tip-carousel__btn--next");
    // Optional elements of the featured variant (visual panel, tag, counter, progress bar)
    const tipVisual = tipCarousel.querySelector(".tip-carousel__visual");
    const tipTag = tipCarousel.querySelector(".tip-carousel__tag");
    const tipCount = tipCarousel.querySelector(".tip-carousel__count");
    const tipProgress = tipCarousel.querySelector(".tip-carousel__progress");
    const TIP_DELAY = 7000;
    let tipIndex = 0;
    let tipTimer = null;
    let tipPaused = false;

    // Tips can be plain strings or objects: { text, tag, stat, unit, suffix, bars: [{ label, value, suffix }] }
    // (bar values are shown with a "%" suffix unless the tip or bar sets its own)
    const normalizeTip = (tip) => (typeof tip === "string" ? { text: tip } : tip);

    const el = (tag, className, text) => {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    };

    const renderVisual = (tip) => {
      if (!tipVisual) return;
      tipVisual.replaceChildren();
      if (tip.bars && tip.bars.length) {
        const max = Math.max(...tip.bars.map((b) => b.value));
        const chart = el("div", "tip-chart");
        tip.bars.forEach((bar) => {
          const col = el("div", "tip-chart__col");
          const suffix = bar.suffix ?? tip.suffix ?? "%";
          const value = String(bar.value).replace(".", ",") + suffix;
          col.appendChild(el("span", "tip-chart__value", value));
          const fill = el("span", "tip-chart__bar");
          fill.style.setProperty("--h", ((bar.value / max) * 100).toFixed(1) + "%");
          col.appendChild(fill);
          col.appendChild(el("span", "tip-chart__label", bar.label));
          chart.appendChild(col);
        });
        tipVisual.appendChild(chart);
        if (tip.unit) tipVisual.appendChild(el("span", "tip-visual__unit", tip.unit));
      } else if (tip.stat) {
        const stat = el("span", "tip-visual__stat", tip.stat);
        if (tip.stat.length > 5) stat.classList.add("is-long");
        tipVisual.appendChild(stat);
        if (tip.unit) tipVisual.appendChild(el("span", "tip-visual__unit", tip.unit));
      } else {
        tipVisual.appendChild(el("span", "tip-visual__stat tip-visual__stat--icon", "?"));
      }
    };

    tips.forEach((_, i) => {
      const dot = document.createElement("span");
      if (i === 0) dot.classList.add("is-active");
      dot.addEventListener("click", () => showTip(i, true));
      tipDots.appendChild(dot);
    });

    const restartProgress = () => {
      if (!tipProgress) return;
      tipProgress.classList.remove("is-running");
      void tipProgress.offsetWidth; // reflow so the CSS animation restarts
      if (!prefersReducedMotion) tipProgress.classList.add("is-running");
    };

    const showTip = (index, userTriggered) => {
      tipIndex = (index + tips.length) % tips.length;
      const tip = normalizeTip(tips[tipIndex]);
      tipText.textContent = tip.text;
      if (tipTag) {
        tipTag.textContent = tip.tag || "";
        tipTag.hidden = !tip.tag;
      }
      if (tipCount) tipCount.textContent = tipIndex + 1 + " / " + tips.length;
      renderVisual(tip);
      tipCarousel.classList.remove("is-changing");
      void tipCarousel.offsetWidth;
      tipCarousel.classList.add("is-changing");
      Array.from(tipDots.children).forEach((dot, i) => dot.classList.toggle("is-active", i === tipIndex));
      if (userTriggered) restartAutoplay();
      else restartProgress();
    };

    const restartAutoplay = () => {
      if (tipTimer) clearInterval(tipTimer);
      if (prefersReducedMotion) return;
      restartProgress();
      tipTimer = setInterval(() => {
        if (!tipPaused) showTip(tipIndex + 1, false);
      }, TIP_DELAY);
    };

    // Pause while the reader is hovering or focused on the carousel
    const setPaused = (paused) => {
      tipPaused = paused;
      tipCarousel.classList.toggle("is-paused", paused);
    };
    tipCarousel.addEventListener("mouseenter", () => setPaused(true));
    tipCarousel.addEventListener("mouseleave", () => {
      setPaused(false);
      restartAutoplay();
    });

    tipPrev.addEventListener("click", () => showTip(tipIndex - 1, true));
    tipNext.addEventListener("click", () => showTip(tipIndex + 1, true));
    showTip(0, false);
    restartAutoplay();
  });

  // Suggestion form (front-end demo only, no network request)
  if (suggestForm) {
    suggestForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!suggestForm.checkValidity()) {
        suggestForm.reportValidity();
        return;
      }
      formSuccess.classList.add("is-visible");
      suggestForm.reset();
      formSuccess.setAttribute("tabindex", "-1");
      formSuccess.focus();
    });
  }

  // Scroll progress bar
  const scrollProgress = document.getElementById("scrollProgress");
  if (scrollProgress) {
    const updateProgress = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      scrollProgress.style.width = pct + "%";
    };
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    updateProgress();
  }

  // Scroll-reveal: fade/slide elements in as they enter the viewport
  const revealEls = Array.from(document.querySelectorAll(".reveal"));
  if (revealEls.length) {
    const groups = new Map();
    revealEls.forEach((el) => {
      const parent = el.parentElement;
      const i = groups.get(parent) || 0;
      el.style.setProperty("--reveal-i", Math.min(i, 6));
      groups.set(parent, i + 1);
    });

    if (prefersReducedMotion) {
      revealEls.forEach((el) => el.classList.add("is-visible"));
    } else {
      const revealObserver = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
      );
      revealEls.forEach((el) => revealObserver.observe(el));
    }
  }

  // Filtro de recursos (Infografías, Lecturas, Historietas, Aplicativo, Estadísticas, Enlaces)
  const resourceGrid = document.getElementById("resourceGrid");
  const filterChips = Array.from(document.querySelectorAll(".filter-chip"));
  if (resourceGrid && filterChips.length) {
    const resourceCards = Array.from(resourceGrid.querySelectorAll(".resource-card"));

    filterChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const filter = chip.dataset.filter;
        filterChips.forEach((c) => c.classList.toggle("is-active", c === chip));
        resourceCards.forEach((card) => {
          const matches = filter === "all" || card.classList.contains(`resource-card--${filter}`);
          card.classList.toggle("is-filtered-out", !matches);
        });
      });
    });
  }

  // Infografía "Pilares": ¿qué pasa si un pilar falla? — one column cracks and everything above collapses
  const pilaresFig = document.querySelector(".pilares");
  const pilaresFail = document.getElementById("pilaresFail");
  if (pilaresFig && pilaresFail && typeof Element.prototype.animate === "function") {
    const stage = pilaresFig.querySelector(".pilares__stage");
    const lintel = pilaresFig.querySelector(".pilares__lintel");
    const blocks = Array.from(pilaresFig.querySelectorAll(".p-block"));
    const alertBox = document.getElementById("pilaresAlert");
    const rebuildBtn = document.getElementById("pilaresRebuild");
    const scenarios = {
      monetary: {
        dir: -1,
        title: "¡Falló la Política Monetaria!",
        text: "Sin estabilidad monetaria, la inflación se dispara: el dinero pierde valor, los precios suben sin control y las familias y empresas dejan de ahorrar e invertir.",
      },
      fiscal: {
        dir: 1,
        title: "¡Falló la Política Fiscal!",
        text: "Sin cuentas fiscales sostenibles, la deuda pública crece sin control: sube el costo del financiamiento, cae la confianza y faltan recursos para educación e infraestructura.",
      },
    };
    // Crack line across the shaft, in % of the shaft box (follows the shaft's tapered sides)
    const crack = [[2, 50], [18, 44], [33, 56], [50, 46], [66, 58], [82, 47], [98.2, 54]];
    const timers = [];
    let anims = [];
    let extras = [];
    let failedColumn = null;
    let nextPillar = "monetary";

    const rand = (min, max) => min + Math.random() * (max - min);
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const play = (el, frames, opts) => {
      const a = el.animate(frames, { fill: "forwards", ...opts });
      anims.push(a);
      return a;
    };
    // Translation that makes a rotation about the element's centre equal a rotation about pivot (px, py)
    const aboutPivot = (cx, cy, px, py, deg) => {
      const r = (deg * Math.PI) / 180;
      const dx = cx - px;
      const dy = cy - py;
      return [px + dx * Math.cos(r) - dy * Math.sin(r) - cx, py + dx * Math.sin(r) + dy * Math.cos(r) - cy];
    };
    // Half the height of a w×h box once rotated, to rest it exactly on the floor
    const halfHeight = (w, h, deg) => {
      const r = (deg * Math.PI) / 180;
      return (w * Math.abs(Math.sin(r)) + h * Math.abs(Math.cos(r))) / 2;
    };

    const collapse = () => {
      const key = nextPillar;
      nextPillar = key === "monetary" ? "fiscal" : "monetary";
      const { dir, title, text } = scenarios[key];
      const t = prefersReducedMotion ? 0 : 1; // reduced motion: jump straight to the final scene
      const column = pilaresFig.querySelector(`.pilares__column--${key}`);
      const healthy = pilaresFig.querySelector(`.pilares__column--${key === "monetary" ? "fiscal" : "monetary"}`);
      const shaft = column.querySelector(".pilares__shaft");
      const capital = column.querySelector(".pilares__capital");
      failedColumn = column;

      pilaresFail.disabled = true;
      pilaresFig.classList.add("is-failing");

      // Geometry (viewport coords), measured before anything moves
      const floor = healthy.getBoundingClientRect().bottom;
      const sRect = shaft.getBoundingClientRect();
      const hRect = healthy.getBoundingClientRect();
      const lRect = lintel.getBoundingClientRect();
      const crackPt = (pt) => [sRect.left + (pt[0] / 100) * sRect.width, sRect.top + (pt[1] / 100) * sRect.height];

      // 1. The column trembles and a crack spreads across it
      play(column, [
        { transform: "none" },
        { transform: "translateX(-3px)" },
        { transform: "translateX(3px)" },
        { transform: "translateX(-2px)" },
        { transform: "translateX(2px)" },
        { transform: "none" },
      ], { duration: 500 * t });
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("class", "pilares__crack");
      svg.setAttribute("viewBox", "0 0 100 100");
      svg.setAttribute("preserveAspectRatio", "none");
      svg.setAttribute("aria-hidden", "true");
      Object.assign(svg.style, {
        left: `${shaft.offsetLeft}px`,
        top: `${shaft.offsetTop}px`,
        width: `${shaft.offsetWidth}px`,
        height: `${shaft.offsetHeight}px`,
      });
      const line = document.createElementNS(svgNS, "polyline");
      line.setAttribute("points", crack.map((p) => p.join(",")).join(" "));
      line.setAttribute("pathLength", "1");
      line.setAttribute("vector-effect", "non-scaling-stroke");
      if (!t) line.style.animation = "none";
      svg.appendChild(line);
      column.appendChild(svg);
      extras.push(svg);

      // 2. The shaft snaps: the upper half (with the capital) topples outwards
      later(() => {
        svg.remove();
        const zig = crack.map(([x, y]) => `${x}% ${y}%`);
        const fragment = shaft.cloneNode(true);
        fragment.classList.add("pilares__shaft--fragment");
        fragment.setAttribute("aria-hidden", "true");
        Object.assign(fragment.style, {
          left: `${shaft.offsetLeft}px`,
          top: `${shaft.offsetTop}px`,
          width: `${shaft.offsetWidth}px`,
          height: `${shaft.offsetHeight}px`,
          clipPath: `polygon(4% 0, 96% 0, ${zig.slice().reverse().join(", ")})`,
        });
        column.appendChild(fragment);
        extras.push(fragment);
        shaft.style.clipPath = `polygon(${zig.join(", ")}, 100% 100%, 0 100%)`;

        // Rigid fall of fragment + capital about the outer end of the crack
        const [px, py] = crackPt(dir < 0 ? crack[0] : crack[crack.length - 1]);
        const angle = dir * 84;
        const tumble = (el) => {
          const r = el.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const [tx1, ty1] = aboutPivot(cx, cy, px, py, dir * 10);
          const [tx2, ty2] = aboutPivot(cx, cy, px, py, angle);
          const drop = Math.max(0, floor - py - 4);
          play(el, [
            { transform: "none", easing: "ease-in" },
            { transform: `translate(${tx1}px, ${ty1}px) rotate(${dir * 10}deg)`, offset: 0.3, easing: "cubic-bezier(0.55, 0, 1, 0.45)" },
            { transform: `translate(${tx2 + dir * 30}px, ${ty2 + drop}px) rotate(${angle}deg)`, offset: 0.85, easing: "ease-out" },
            { transform: `translate(${tx2 + dir * 30}px, ${ty2 + drop - 10}px) rotate(${angle - dir * 4}deg)`, offset: 0.93, easing: "ease-in" },
            { transform: `translate(${tx2 + dir * 30}px, ${ty2 + drop}px) rotate(${angle}deg)` },
          ], { duration: 1300 * t });
        };
        tumble(fragment);
        tumble(capital);
      }, 550 * t);

      // 3. The lintel loses its support: it tips over the broken column and comes to rest on the stub
      later(() => {
        const hx = hRect.left + hRect.width / 2;
        const hy = lRect.bottom;
        const [sx, sy] = crackPt(crack[3]);
        const tilt = dir * Math.min(40, (Math.atan2(sy - hy, Math.abs(sx - hx)) * 180) / Math.PI);
        const cx = lRect.left + lRect.width / 2;
        const cy = lRect.top + lRect.height / 2;
        const [tx, ty] = aboutPivot(cx, cy, hx, hy, tilt);
        const [bx, by] = aboutPivot(cx, cy, hx, hy, tilt * 0.9);
        play(lintel, [
          { transform: "none", easing: "cubic-bezier(0.55, 0, 1, 0.45)" },
          { transform: `translate(${tx}px, ${ty}px) rotate(${tilt}deg)`, offset: 0.75, easing: "ease-out" },
          { transform: `translate(${bx}px, ${by}px) rotate(${tilt * 0.9}deg)`, offset: 0.87, easing: "ease-in" },
          { transform: `translate(${tx}px, ${ty}px) rotate(${tilt}deg)` },
        ], { duration: 1000 * t });
      }, 800 * t);

      // 4. Every benefit block tumbles down to the ground
      blocks.forEach((block, i) => {
        const r = block.getBoundingClientRect();
        const spin = dir * rand(25, 110) * (Math.random() < 0.25 ? -1 : 1);
        const dx = dir * rand(10, 110) + rand(-30, 30);
        const dy = floor - (r.top + r.height / 2) - halfHeight(r.width, r.height, spin);
        const delay = (850 + (blocks.length - 1 - i) * 70 + rand(0, 120)) * t;
        play(block, [
          { transform: "none", easing: "ease-out" },
          { transform: `translate(${dx * 0.1}px, -14px) rotate(${spin * 0.1}deg)`, offset: 0.15, easing: "cubic-bezier(0.55, 0, 1, 0.45)" },
          { transform: `translate(${dx}px, ${dy}px) rotate(${spin}deg)`, offset: 0.78, easing: "ease-out" },
          { transform: `translate(${dx * 1.06}px, ${dy - 16}px) rotate(${spin * 1.05}deg)`, offset: 0.88, easing: "ease-in" },
          { transform: `translate(${dx * 1.1}px, ${dy}px) rotate(${spin * 1.08}deg)` },
        ], { duration: 1100 * t, delay });
      });

      // 5. Impact shake, then explain what happened
      later(() => {
        if (t) {
          play(stage, [
            { transform: "none" },
            { transform: "translateY(4px)" },
            { transform: "translateY(-3px)" },
            { transform: "translateY(2px)" },
            { transform: "none" },
          ], { duration: 350, fill: "none" });
        }
      }, 1750 * t);
      later(() => {
        pilaresFig.classList.add("is-collapsed");
        alertBox.querySelector(".pilares__alert-title").textContent = title;
        alertBox.querySelector(".pilares__alert-text").textContent = text;
        alertBox.hidden = false;
        rebuildBtn.focus({ preventScroll: true });
      }, 2300 * t);
    };

    const rebuild = () => {
      timers.splice(0).forEach(clearTimeout);
      anims.forEach((a) => a.cancel());
      anims = [];
      extras.forEach((el) => el.remove());
      extras = [];
      if (failedColumn) failedColumn.querySelector(".pilares__shaft").style.clipPath = "";
      alertBox.hidden = true;
      pilaresFig.classList.remove("is-failing", "is-collapsed");
      pilaresFail.disabled = false;
      pilaresFail.focus({ preventScroll: true });
      if (prefersReducedMotion || !failedColumn) return;

      // Build everything back up, bottom to top
      const drop = [{ opacity: 0, transform: "translateY(-24px)" }, { opacity: 1, transform: "none" }];
      const ease = "cubic-bezier(0.2, 0.8, 0.3, 1.2)";
      [failedColumn.querySelector(".pilares__shaft"), failedColumn.querySelector(".pilares__capital")].forEach((el) => {
        el.animate([{ opacity: 0, transform: "scaleY(0.6)" }, { opacity: 1, transform: "none" }], { duration: 450, easing: ease });
      });
      lintel.animate(drop, { duration: 450, delay: 250, easing: ease, fill: "backwards" });
      blocks.forEach((block, i) => {
        block.animate(drop, { duration: 450, delay: 400 + i * 90, easing: ease, fill: "backwards" });
      });
      failedColumn = null;
    };

    pilaresFail.addEventListener("click", collapse);
    rebuildBtn.addEventListener("click", rebuild);
  }

  // Hero video card: subtle 3D tilt following the pointer (desktop only)
  const videoCard = document.getElementById("videoCard");
  if (videoCard && !prefersReducedMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    videoCard.addEventListener(
      "animationend",
      () => {
        videoCard.style.animation = "none";
        videoCard.style.opacity = "1";
        videoCard.style.transform = "rotate(0.4deg)";
      },
      { once: true }
    );

    videoCard.addEventListener("mousemove", (event) => {
      const rect = videoCard.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      const rotateY = x * 10;
      const rotateX = y * -10;
      videoCard.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.015)`;
    });

    videoCard.addEventListener("mouseleave", () => {
      videoCard.style.transform = "rotate(0.4deg)";
    });
  }
})();
