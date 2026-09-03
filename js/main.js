(() => {
  const header = document.getElementById("siteHeader");
  const navToggle = document.getElementById("navToggle");
  const primaryNav = document.getElementById("primaryNav");
  const navLinks = document.querySelectorAll(".nav-link");
  const backToTop = document.getElementById("backToTop");
  const suggestForm = document.getElementById("suggestForm");
  const formSuccess = document.getElementById("formSuccess");

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

  // Scrollspy via IntersectionObserver
  const sections = Array.from(document.querySelectorAll("main section[id]"));
  const linkById = new Map(
    Array.from(navLinks).map((link) => [link.getAttribute("href").replace("#", ""), link])
  );

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const link = linkById.get(entry.target.id);
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach((l) => l.classList.remove("active"));
          link.classList.add("active");
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));

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

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  // Interactive Flujo Circular diagram: nodes <-> arrows <-> description cards
  const flowDiagram = document.getElementById("flowDiagram");
  if (flowDiagram) {
    const flowNodes = Array.from(flowDiagram.querySelectorAll(".flow-node"));
    const flowItems = Array.from(document.querySelectorAll(".flow-list li[data-flow]"));
    const flowArrows = Array.from(flowDiagram.querySelectorAll(".flow-arrow, .flow-arrow-label"));
    const nodeByKey = new Map(flowNodes.map((n) => [n.dataset.flow, n]));
    const itemByKey = new Map(flowItems.map((li) => [li.dataset.flow, li]));

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
