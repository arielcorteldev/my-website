(() => {
  const html = document.documentElement;

  const prefersReducedMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  )?.matches;

  function applyImages(theme) {
    document.querySelectorAll("[data-light-src]").forEach((img) => {
      img.src = theme === "dark" ? img.dataset.darkSrc : img.dataset.lightSrc;
    });
  }

  // Theme toggle (sync desktop + mobile toggles)
  const themeToggles = Array.from(
    document.querySelectorAll('input.js-theme-toggle[type="checkbox"]'),
  );

  function getInitialTheme() {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
    const systemPrefersDark = window.matchMedia?.(
      "(prefers-color-scheme: dark)",
    )?.matches;
    return systemPrefersDark ? "dark" : "light";
  }

  function setTheme(theme, { persist } = { persist: true }) {
    html.classList.toggle("dark-mode", theme === "dark");
    html.classList.toggle("light-mode", theme === "light");

    themeToggles.forEach((t) => {
      t.checked = theme === "dark";
    });

    if (persist) localStorage.setItem("theme", theme);
    applyImages(theme);
  }

  const initialTheme = getInitialTheme();
  setTheme(initialTheme, { persist: false });

  themeToggles.forEach((toggle) => {
    toggle.addEventListener("change", (e) => {
      const nextTheme = e.target.checked ? "dark" : "light";
      setTheme(nextTheme);
    });
  });

  // Mobile drawer
  const menuBtn = document.getElementById("menu-btn");
  const drawer = document.getElementById("mobile-drawer");
  const overlay = document.getElementById("drawer-overlay");
  const closeBtn = document.getElementById("drawer-close-btn");
  const drawerLinks = Array.from(
    document.querySelectorAll(".drawer-link, .drawer-cta"),
  );

  const FOCUSABLE =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  const pageChrome = Array.from(document.querySelectorAll("header, main, footer"));

  function setPageInert(isInert) {
    pageChrome.forEach((el) => {
      if (isInert) {
        el.setAttribute("aria-hidden", "true");
        // inert is supported in modern browsers; safe to set even if ignored
        el.inert = true;
      } else {
        el.removeAttribute("aria-hidden");
        el.inert = false;
      }
    });
  }

  function openDrawer() {
    if (!drawer || !overlay || !menuBtn || !closeBtn) return;

    drawer.classList.add("drawer-open");
    overlay.classList.add("drawer-overlay-visible");
    document.body.classList.add("drawer-open");

    menuBtn.setAttribute("aria-expanded", "true");
    drawer.setAttribute("aria-hidden", "false");
    overlay.setAttribute("aria-hidden", "false");
    overlay.setAttribute("tabindex", "0");

    setPageInert(true);
    drawer.inert = false;
    overlay.inert = false;

    closeBtn.focus();
    document.addEventListener("keydown", handleDrawerKeydown);
  }

  function closeDrawer() {
    if (!drawer || !overlay || !menuBtn) return;

    drawer.classList.remove("drawer-open");
    overlay.classList.remove("drawer-overlay-visible");
    document.body.classList.remove("drawer-open");

    menuBtn.setAttribute("aria-expanded", "false");
    drawer.setAttribute("aria-hidden", "true");
    overlay.setAttribute("aria-hidden", "true");
    overlay.removeAttribute("tabindex");

    setPageInert(false);

    menuBtn.focus();
    document.removeEventListener("keydown", handleDrawerKeydown);
  }

  function handleDrawerKeydown(e) {
    if (e.key === "Escape") {
      closeDrawer();
      return;
    }

    if (e.key !== "Tab" || !drawer?.classList.contains("drawer-open")) return;

    const focusables = drawer.querySelectorAll(FOCUSABLE);
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  menuBtn?.addEventListener("click", openDrawer);
  closeBtn?.addEventListener("click", closeDrawer);
  overlay?.addEventListener("click", closeDrawer);
  drawerLinks.forEach((link) => link.addEventListener("click", closeDrawer));

  // Smooth scrolling (respect reduced motion)
  if (!prefersReducedMotion) {
    document.addEventListener("click", (e) => {
      const a = e.target.closest?.('a[href^="#"]');
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href === "#") return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });

      // Update URL without jumping
      history.pushState(null, "", href);
    });
  }

  // Scroll-triggered animations (IntersectionObserver)
  const revealEls = Array.from(document.querySelectorAll("[data-reveal]"));
  revealEls.forEach((el) => el.classList.add("reveal"));

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    },
    { root: null, threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
  );

  revealEls.forEach((el) => io.observe(el));
})();

