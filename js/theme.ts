// Light and dark for every Nabi site. Load it blocking in <head>, right
// after <meta name="theme-color">: it sets <html class="nb lt|dk js">
// before the first paint (a file, not inline, so a strict CSP allows it),
// then wires the header toggle (.ib.theme) and the footer switch
// ([data-theme-set="auto|light|dark"]). The toggle flips light and dark;
// landing on the system's theme it picks System.
//
// The choice is the `theme` cookie, else localStorage.theme, else the
// system setting. The cookie is set for the site's domain (.nabi-lang.org
// on docs.nabi-lang.org), so the sites under one domain share it.

type Theme = "auto" | "light" | "dark";

(() => {
  const html = document.documentElement;
  const media = matchMedia("(prefers-color-scheme: dark)");
  const BG = { light: "#fcfbfb", dark: "#141114" };

  const isTheme = (t: string | null | undefined): t is Theme => t === "auto" || t === "light" || t === "dark";

  function stored(): Theme {
    const m = document.cookie.match(/(?:^|;\s*)theme=(light|dark)(?:;|$)/);
    if (m && isTheme(m[1])) return m[1];
    try {
      const t = localStorage.getItem("theme");
      return t === "light" || t === "dark" ? t : "auto";
    } catch {
      return "auto";
    }
  }

  const isDark = (t: Theme): boolean => t === "dark" || (t === "auto" && media.matches);

  // The bar colour of the theme in use: the media-query pair would follow
  // the system, not the choice.
  function tint(bg: string): void {
    const m = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (m) m.content = bg;
  }

  // "; Domain=.example.org" for any host under it; none for localhost
  // (and its subdomains) or an IP.
  function domain(): string {
    const h = location.hostname;
    if (!h.includes(".") || /(^|\.)localhost$/.test(h) || /^[\d.]+$/.test(h) || h.includes(":")) return "";
    return "; Domain=." + h.split(".").slice(-2).join(".");
  }

  function apply(): void {
    const t = stored();
    const dark = isDark(t);
    html.classList.toggle("dk", dark);
    html.classList.toggle("lt", !dark);
    tint(getComputedStyle(html).getPropertyValue("--bg").trim() || (dark ? BG.dark : BG.light));
    const ko = html.lang === "ko";
    for (const b of document.querySelectorAll("[data-theme-set]")) b.setAttribute("aria-pressed", b.getAttribute("data-theme-set") === t ? "true" : "false");
    for (const b of document.querySelectorAll<HTMLElement>(".ib.theme")) {
      b.setAttribute("aria-pressed", dark ? "true" : "false");
      b.title = ko ? (dark ? "라이트 테마로 바꾸기" : "다크 테마로 바꾸기") : (dark ? "Switch to light theme" : "Switch to dark theme");
    }
  }

  function choose(t: Theme): void {
    try {
      if (t === "auto") localStorage.removeItem("theme");
      else localStorage.setItem("theme", t);
    } catch {}
    const tail = "; Path=/; SameSite=Lax" + (location.protocol === "https:" ? "; Secure" : "");
    // A host-only cookie from before would shadow the shared one.
    document.cookie = "theme=" + tail + "; Max-Age=0";
    const d = domain();
    document.cookie = t === "auto" ? "theme=" + d + tail + "; Max-Age=0" : "theme=" + t + d + tail + "; Max-Age=31536000";
    apply();
  }

  function wire(): void {
    for (const b of document.querySelectorAll("[data-theme-set]")) {
      b.addEventListener("click", () => {
        const t = b.getAttribute("data-theme-set");
        if (isTheme(t)) choose(t);
      });
    }
    for (const b of document.querySelectorAll(".ib.theme")) {
      // The other theme; back to the system's own, it is System again, so
      // the footer switch never loses it.
      b.addEventListener("click", () => {
        const t: Theme = html.classList.contains("dk") ? "light" : "dark";
        choose(t === (media.matches ? "dark" : "light") ? "auto" : t);
      });
    }
    apply();
  }

  // Before the first paint: the stylesheets may not be in yet, so the
  // bar colour comes from the constants.
  try {
    const dark = isDark(stored());
    html.className = "nb " + (dark ? "dk" : "lt") + " js";
    tint(dark ? BG.dark : BG.light);
  } catch {
    html.className = "nb lt js";
  }

  // The language menu (chrome::lang_menu) is a <details>: Escape closes
  // it and gives the focus back to its button, a click outside closes it.
  document.addEventListener("keydown", (ev) => {
    if (ev.key !== "Escape") return;
    for (const d of document.querySelectorAll<HTMLDetailsElement>("details.lang-menu[open]")) {
      d.open = false;
      d.querySelector("summary")?.focus();
    }
  });
  document.addEventListener("click", (ev) => {
    for (const d of document.querySelectorAll<HTMLDetailsElement>("details.lang-menu[open]")) {
      if (!d.contains(ev.target as Node | null)) d.open = false;
    }
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else wire();
  media.addEventListener("change", apply);
  // Back from another site of the domain, maybe with another theme.
  addEventListener("pageshow", apply);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) apply();
  });
})();

// a module to the type checker; the bundle (tools/build.ts) drops it
export {};
