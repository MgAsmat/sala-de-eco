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

    // Tips can be plain strings or objects: { text, tag, stat, unit, bars: [{ label, value }] }
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
          const value = String(bar.value).replace(".", ",") + "%";
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
