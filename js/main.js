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
    let tipIndex = 0;
    let tipTimer = null;

    tips.forEach((_, i) => {
      const dot = document.createElement("span");
      if (i === 0) dot.classList.add("is-active");
      dot.addEventListener("click", () => showTip(i, true));
      tipDots.appendChild(dot);
    });

    const showTip = (index, userTriggered) => {
      tipIndex = (index + tips.length) % tips.length;
      tipText.textContent = tips[tipIndex];
      Array.from(tipDots.children).forEach((dot, i) => dot.classList.toggle("is-active", i === tipIndex));
      if (userTriggered) restartAutoplay();
    };

    const restartAutoplay = () => {
      if (tipTimer) clearInterval(tipTimer);
      if (prefersReducedMotion) return;
      tipTimer = setInterval(() => showTip(tipIndex + 1, false), 7000);
    };

    tipPrev.addEventListener("click", () => showTip(tipIndex - 1, true));
    tipNext.addEventListener("click", () => showTip(tipIndex + 1, true));
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

  // Interactive Flujo Circular diagram: nodes <-> curved flows <-> description cards
  const flowDiagram = document.getElementById("flowDiagram");
  if (flowDiagram) {
    const flowNodes = Array.from(flowDiagram.querySelectorAll(".flow-node"));
    const flowItems = Array.from(document.querySelectorAll(".flow-list li[data-flow]"));
    const nodeByKey = new Map(flowNodes.map((n) => [n.dataset.flow, n]));
    const itemByKey = new Map(flowItems.map((li) => [li.dataset.flow, li]));

    const connections = [
      { from: "resto-mundo", to: "empresas", label: "Exportaciones · Importaciones", dash: "dotted", arrow: "both", marker: "teal" },
      { from: "empresas", to: "financiero", label: "Crédito · Ahorro", dash: "solid", arrow: "both", marker: "gold" },
      { from: "familias", to: "financiero", label: "Ahorro · Crédito", dash: "solid", arrow: "both", marker: "gold" },
      { from: "empresas", to: "gobierno", label: "Impuestos", dash: "solid", arrow: "end", marker: "navy" },
      { from: "familias", to: "gobierno", label: "Impuestos · Transferencias", dash: "solid", arrow: "both", marker: "navy" },
      { from: "empresas", to: "bienes-servicios", label: "Bienes producidos · Insumos", dash: "solid", arrow: "both", marker: "teal" },
      { from: "familias", to: "bienes-servicios", label: "Consumo", dash: "solid", arrow: "end", marker: "teal" },
      { from: "empresas", to: "trabajo", label: "Contratación", dash: "dashed", arrow: "end", marker: "teal" },
      { from: "familias", to: "trabajo", label: "Oferta laboral · Salarios", dash: "dashed", arrow: "both", marker: "teal" }
    ];

    let flowArrows = [];
    const svg = flowDiagram.querySelector(".flow-diagram__svg");
    const labelsLayer = flowDiagram.querySelector(".flow-labels-layer");

    if (svg && labelsLayer) {
      const centerOf = (el, hostRect) => {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2 - hostRect.left, y: r.top + r.height / 2 - hostRect.top };
      };

      connections.forEach((conn) => {
        const elA = nodeByKey.get(conn.from);
        const elB = nodeByKey.get(conn.to);
        if (!elA || !elB) return;

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("class", conn.dash === "solid" ? "flow-arrow" : `flow-arrow flow-arrow--${conn.dash}`);
        path.dataset.a = conn.from;
        path.dataset.b = conn.to;
        if (conn.arrow === "end" || conn.arrow === "both") path.setAttribute("marker-end", `url(#flowArrowHead-${conn.marker})`);
        if (conn.arrow === "both") path.setAttribute("marker-start", `url(#flowArrowHead-${conn.marker})`);
        svg.appendChild(path);

        const label = document.createElement("div");
        label.className = "flow-arrow-label";
        label.textContent = conn.label;
        label.dataset.a = conn.from;
        label.dataset.b = conn.to;
        labelsLayer.appendChild(label);

        conn.pathEl = path;
        conn.labelEl = label;
      });

      flowArrows = connections.flatMap((c) => [c.pathEl, c.labelEl]).filter(Boolean);

      const positionConnections = () => {
        if (flowDiagram.offsetParent === null) return;
        const hostRect = flowDiagram.getBoundingClientRect();
        svg.setAttribute("viewBox", `0 0 ${hostRect.width} ${hostRect.height}`);
        const cx = hostRect.width / 2;
        const cy = hostRect.height / 2;

        connections.forEach((conn) => {
          const elA = nodeByKey.get(conn.from);
          const elB = nodeByKey.get(conn.to);
          if (!elA || !elB || !conn.pathEl) return;
          const a = centerOf(elA, hostRect);
          const b = centerOf(elB, hostRect);
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          let dx = mx - cx;
          let dy = my - cy;
          const dist = Math.hypot(dx, dy) || 1;
          dx /= dist;
          dy /= dist;
          const c = { x: mx + dx * 30, y: my + dy * 30 };
          conn.pathEl.setAttribute("d", `M ${a.x} ${a.y} Q ${c.x} ${c.y} ${b.x} ${b.y}`);

          const lx = 0.25 * a.x + 0.5 * c.x + 0.25 * b.x;
          const ly = 0.25 * a.y + 0.5 * c.y + 0.25 * b.y;
          conn.labelEl.style.left = `${lx}px`;
          conn.labelEl.style.top = `${ly}px`;
        });
      };

      window.addEventListener("resize", positionConnections);
      window.addEventListener("load", positionConnections);
      positionConnections();
      setTimeout(positionConnections, 200);
    }

    const highlightArrows = (key) => {
      flowArrows.forEach((el) => {
        const connected = key && (el.dataset.a === key || el.dataset.b === key);
        el.classList.toggle("is-highlighted", Boolean(connected));
      });
    };

    const setActive = (key) => {
      flowNodes.forEach((n) => n.classList.toggle("is-active", n.dataset.flow === key));
      flowItems.forEach((li) => li.classList.toggle("is-active", li.dataset.flow === key));
      highlightArrows(key);
    };

    flowNodes.forEach((node) => {
      node.addEventListener("click", () => {
        const key = node.dataset.flow;
        setActive(key);
        const item = itemByKey.get(key);
        if (item) {
          item.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
        }
      });
      node.addEventListener("mouseenter", () => highlightArrows(node.dataset.flow));
      node.addEventListener("mouseleave", () => {
        const activeNode = flowNodes.find((n) => n.classList.contains("is-active"));
        highlightArrows(activeNode ? activeNode.dataset.flow : null);
      });
    });

    flowItems.forEach((li) => {
      li.addEventListener("mouseenter", () => {
        const node = nodeByKey.get(li.dataset.flow);
        if (node) node.classList.add("is-hover");
        highlightArrows(li.dataset.flow);
      });
      li.addEventListener("mouseleave", () => {
        const node = nodeByKey.get(li.dataset.flow);
        if (node) node.classList.remove("is-hover");
        const activeNode = flowNodes.find((n) => n.classList.contains("is-active"));
        highlightArrows(activeNode ? activeNode.dataset.flow : null);
      });
      li.addEventListener("click", () => setActive(li.dataset.flow));
    });
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
