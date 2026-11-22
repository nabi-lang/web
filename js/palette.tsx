// The search palette of the Nabi sites: Cmd+K or Ctrl+K (keys.ts), or a
// click on any [data-palette] button, opens one field over the docs, the
// standard library, the packages and the examples, its results grouped
// Docs / Std / Packages / Examples. Load it with `defer`:
//
//   <script src="/palette.js" data-docs="https://docs.nabi-lang.org/latest/"
//     data-pkgdocs="https://docs.nabi-lang.org/packages/"
//     data-registry="https://packages.nabi-lang.org" defer></script>
//
// data-docs is a docs version's root (default: <body data-root>); its
// search-index.json (ko/search-index.json on Korean pages) is read for
// names only: {p: [[title, url, ..]], h: [[page, heading, id, named,
// kind, ..]]}, urls from that root. data-pkgdocs holds search-api.json,
// every package's API in the same form, urls from there. The registry's
// GET /api/v1/docs?format=json lists the packages. Each is fetched once,
// when the palette first needs it; one that fails only leaves its group
// out. The other hosts must answer with Access-Control-Allow-Origin.
import { render } from "preact";

(() => {
  interface Index {
    p: [t: string, u: string, ...rest: unknown[]][];
    h: [n: number, t: string, id: string, named?: unknown, kind?: string, ...rest: unknown[]][];
  }
  interface Registry { name: string; description?: string; official?: boolean }
  /** title, address, page title, API kind, group */
  interface Entry { t: string; u: string; p: string; k: string; g: Group }
  type Group = "docs" | "std" | "pkgs" | "examples";
  interface Shown { t: string; u: string; note: string; tag: string }

  const me = document.currentScript as HTMLScriptElement | null;
  const conf = me ? me.dataset : {};
  const ko = document.documentElement.lang === "ko";
  const docs = conf.docs || document.body.dataset.root || "/";
  const pkgdocs = conf.pkgdocs || "";
  const registry = (conf.registry || "").replace(/\/$/, "");

  const T = ko
    ? { label: "Nabi 검색", ph: "문서, 표준 라이브러리, 패키지 검색", hint: "문서, 표준 라이브러리, 패키지, 예제를 한 번에 찾습니다.", none: "결과 없음", down: "검색할 수 없습니다. 잠시 후 다시 시도하세요.", found: (n: number) => `결과 ${n}개`, close: "닫기",
        groups: { docs: "문서", std: "표준 라이브러리", pkgs: "패키지", examples: "예제" }, legend: [["↑ ↓", "이동"], ["↵", "열기"], ["esc", "닫기"]] as [string, string][], pkg: "패키지", official: "공식" }
    : { label: "Search Nabi", ph: "Search docs, std and packages", hint: "Finds pages of the docs, items of the standard library, packages and examples.", none: "No results", down: "Search is unavailable right now.", found: (n: number) => (n === 1 ? "1 result" : `${n} results`), close: "Close",
        groups: { docs: "Docs", std: "Std", pkgs: "Packages", examples: "Examples" }, legend: [["↑ ↓", "to move"], ["↵", "to open"], ["esc", "to close"]] as [string, string][], pkg: "package", official: "official" };
  const ORDER: Group[] = ["docs", "std", "pkgs", "examples"];
  const PER = 5;
  const KIND_ORDER: Record<string, number> = { struct: 0, enum: 0, trait: 0, type: 1, fn: 2, const: 3, static: 3, impl: 4, method: 5 };

  const json = <J,>(url: string): Promise<J> => fetch(url).then((r) => {
    if (!r.ok) throw new Error(`${url}: ${r.status}`);
    return r.json() as Promise<J>;
  });
  // An index's entries: its pages, then its headings under their page.
  const entries = (d: Index, base: string, group: (u: string, k: string) => Group): Entry[] => {
    const out: Entry[] = d.p.map(([t, u]) => ({ t, u: base + u, p: "", k: "", g: group(u, "") }));
    for (const [n, t, id, named, kind] of d.h) {
      const pg = d.p[n];
      if (!pg) continue;
      const k = kind || "";
      out.push({ t: named ? `${pg[0]} › ${t}` : t, u: `${base}${pg[1]}#${id}`, p: pg[0], k, g: group(pg[1], k) });
    }
    return out;
  };
  const docsGroup = (u: string, k: string): Group => {
    const v = u.replace(/^ko\//, "");
    if (k || v === "std" || v.startsWith("std/") || v.startsWith("spec/refs-standard-libraries")) return "std";
    if (v === "examples" || v.startsWith("examples/")) return "examples";
    return "docs";
  };

  let docsIdx: Promise<Entry[]> | null = null;
  let pkgIdx: Promise<Entry[]> | null = null;
  const loadDocs = (): Promise<Entry[]> => (docsIdx ??= json<Index>(docs + (ko ? "ko/" : "") + "search-index.json").then((d) => entries(d, docs, docsGroup)));
  // Packages: the registry's list, then each package's API; either alone
  // will do.
  const loadPkgs = (): Promise<Entry[]> => (pkgIdx ??= Promise.all([
    registry ? json<Registry[]>(registry + "/api/v1/docs?format=json").catch(() => [] as Registry[]) : Promise.resolve([] as Registry[]),
    pkgdocs ? json<Index>(pkgdocs + "search-api.json").catch(() => ({ p: [], h: [] }) as Index) : Promise.resolve({ p: [], h: [] } as Index),
  ]).then(([list, api]) => {
    const withDocs = new Set(api.p.filter(([, u]) => /^[^/]+\/latest$/.test(u)).map(([, u]) => u.split("/")[0]!));
    const out: Entry[] = list.map((r) => ({
      t: r.name, u: withDocs.has(r.name) ? `${pkgdocs}${r.name}/latest` : `${registry}/packages/${r.name}`,
      p: r.description || "", k: r.official ? "official" : "package", g: "pkgs" as Group,
    }));
    const listed = new Set(list.map((r) => r.name));
    for (const e of entries(api, pkgdocs, () => "pkgs")) {
      // a package's root page stands for it when the registry is out of reach
      if (!e.p && listed.has(e.t)) continue;
      if (!e.p && !e.t.includes("::")) e.k = "package";
      out.push(e);
    }
    return out;
  }));

  // Ranking: a name equal to the query, one starting with it, a title or
  // heading starting with it, one with a word starting with it, then one
  // holding every term; types before functions before methods.
  const esc = (w: string): string => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const score = (e: Entry, q: string, terms: string[]): number => {
    const t = e.t.toLowerCase();
    const name = t.split("::").pop()!.split(" › ").pop()!;
    if (name === q || t === q) return 0;
    if (name.startsWith(q)) return 1;
    if (t.startsWith(q)) return 2;
    if (new RegExp("(^|[^\\p{L}\\p{N}_])" + esc(q), "u").test(t)) return 3;
    if (q.length < 3) return -1;
    const hay = t + " " + e.p.toLowerCase();
    return terms.every((w) => hay.includes(w)) ? 4 : -1;
  };
  const pick = (all: Entry[], q: string): Entry[] => {
    const terms = q.split(/\s+/).filter(Boolean);
    const hits: [number, number, number, Entry][] = [];
    for (const e of all) {
      const s = score(e, q, terms);
      if (s >= 0) hits.push([s, e.k ? (KIND_ORDER[e.k] ?? 6) : e.p ? 7 : 6, e.t.length, e]);
    }
    hits.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
    return hits.map((h) => h[3]);
  };

  const KIND: Record<string, string> = ko
    ? { method: "메서드", fn: "함수", trait: "트레잇", type: "타입 별칭", const: "상수", static: "정적", package: T.pkg, official: T.official }
    : { package: T.pkg, official: T.official };
  const shown = (e: Entry): Shown => ({ t: e.t, u: e.u, note: e.p, tag: e.k ? KIND[e.k] || e.k : "" });

  interface View { q: string; groups: [Group, Shown[]][] | null; sel: number; busy: boolean }

  function Marked({ text, q }: { text: string; q: string }) {
    const words = q.split(/\s+/).filter(Boolean).map(esc);
    if (!words.length) return <>{text}</>;
    const parts = text.split(new RegExp(`(${words.join("|")})`, "gi"));
    return <>{parts.map((s, k) => (k % 2 ? <mark>{s}</mark> : s))}</>;
  }

  function Palette({ v, onInput, onKey }: { v: View; onInput: (q: string) => void; onKey: (ev: KeyboardEvent) => void }) {
    let k = -1;
    const n = v.groups ? v.groups.reduce((a, [, h]) => a + h.length, 0) : 0;
    return (
      <div class="pal-box">
        <div class="pal-q">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
          <input id="pal-q" type="search" value={v.q} placeholder={T.ph} aria-label={T.label} autocomplete="off" spellcheck={false}
            role="combobox" aria-autocomplete="list" aria-expanded={n > 0 ? "true" : "false"} aria-controls="pal-list"
            aria-activedescendant={v.sel >= 0 && v.sel < n ? `pal-${v.sel}` : undefined}
            onInput={(ev) => onInput((ev.currentTarget as HTMLInputElement).value)} onKeyDown={onKey} />
          <button type="button" class="pal-x" aria-label={T.close} onClick={() => close()}><kbd class="kbd" aria-hidden="true">esc</kbd></button>
        </div>
        <div id="pal-list" class="pal-list" role="listbox" aria-label={T.label}>
          {!v.q.trim() ? <p class="pal-note" role="presentation">{T.hint}</p>
            : v.groups === null ? <p class="pal-note" role="presentation">{T.down}</p>
            : !n && !v.busy ? <p class="pal-note" role="presentation">{T.none}</p>
            : v.groups.map(([g, hits]) => (
              <div role="group" aria-labelledby={`pal-g-${g}`} class="pal-grp">
                <p class="pal-g t-label" id={`pal-g-${g}`} role="presentation">{T.groups[g]}</p>
                {hits.map((h) => {
                  k++;
                  return (
                    <a id={`pal-${k}`} role="option" tabIndex={-1} href={h.u} aria-selected={k === v.sel ? "true" : "false"}>
                      {h.tag ? <span class="pal-tag">{h.tag}</span> : null}
                      <span class="pal-t"><Marked text={h.t} q={v.q} /></span>
                      {h.note ? <small>{h.note}</small> : null}
                    </a>
                  );
                })}
              </div>
            ))}
        </div>
        <p class="pal-foot" aria-hidden="true">{T.legend.map(([key, what]) => <span>{key.split(" ").map((x) => <kbd class="kbd">{x}</kbd>)}{" " + what}</span>)}</p>
        <p class="sr-only" role="status">{v.q.trim() && v.groups ? (n ? T.found(n) : v.busy ? "" : T.none) : ""}</p>
      </div>
    );
  }

  let dlg: HTMLDialogElement | null = null;
  let back: HTMLElement | null = null;
  let view: View = { q: "", groups: [], sel: -1, busy: false };
  let asked = 0;

  const draw = (): void => { if (dlg) render(<Palette v={view} onInput={search} onKey={key} />, dlg); };
  const options = (): HTMLAnchorElement[] => (dlg ? [...dlg.querySelectorAll<HTMLAnchorElement>("a[role=option]")] : []);
  const select = (i: number): void => {
    view = { ...view, sel: i };
    draw();
    options()[i]?.scrollIntoView({ block: "nearest" });
  };

  async function search(q: string): Promise<void> {
    const mine = ++asked;
    view = { ...view, q, sel: -1 };
    const query = q.trim().toLowerCase();
    if (!query) { view = { ...view, groups: [] }; draw(); return; }
    draw();
    const per: Record<Group, Shown[]> = { docs: [], std: [], pkgs: [], examples: [] };
    const fill = (all: Entry[]): void => {
      for (const g of ORDER) if (g !== "pkgs") per[g] = [];
      const by: Record<Group, Entry[]> = { docs: [], std: [], pkgs: [], examples: [] };
      for (const e of pick(all, query)) if (by[e.g].length < PER) by[e.g].push(e);
      for (const g of ORDER) if (g !== "pkgs" || by.pkgs.length) per[g] = by[g].map(shown);
    };
    const show = (busy: boolean): void => {
      if (mine !== asked) return;
      const groups = ORDER.filter((g) => per[g].length).map((g) => [g, per[g]] as [Group, Shown[]]);
      view = { ...view, groups, busy, sel: groups.length ? 0 : -1 };
      draw();
    };
    let docsOk = true;
    const d = loadDocs().then(fill, () => { docsOk = false; });
    // packages wait for a query of two letters or more
    const p = query.length >= 2 ? loadPkgs().then((all) => { per.pkgs = pick(all, query).slice(0, PER).map(shown); }, () => {}) : Promise.resolve();
    await d;
    if (!docsOk && mine === asked) { view = { ...view, groups: null }; draw(); return; }
    show(true);
    await p;
    show(false);
  }

  function key(ev: KeyboardEvent): void {
    const n = options().length;
    if (ev.isComposing) return;
    // before the search field's own Escape, which would only clear it
    if (ev.key === "Escape") { ev.preventDefault(); close(); return; }
    if (ev.key === "ArrowDown" && n) { ev.preventDefault(); select((view.sel + 1) % n); }
    else if (ev.key === "ArrowUp" && n) { ev.preventDefault(); select((view.sel - 1 + n) % n); }
    else if (ev.key === "Enter") {
      const a = options()[view.sel];
      if (a) { ev.preventDefault(); location.href = a.href; }
    }
  }

  function open(): void {
    if (!dlg) {
      dlg = document.createElement("dialog");
      dlg.className = "pal";
      dlg.setAttribute("aria-label", T.label);
      // a click on the backdrop is a click on the dialog itself
      dlg.addEventListener("click", (ev) => { if (ev.target === dlg) close(); });
      dlg.addEventListener("close", () => { back?.focus({ preventScroll: true }); back = null; });
      document.body.append(dlg);
    }
    if (dlg.open) return;
    back = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    draw();
    dlg.showModal();
    const q = dlg.querySelector<HTMLInputElement>("#pal-q")!;
    q.focus();
    q.select();
    loadDocs().catch(() => {});
  }

  function close(): void { if (dlg && dlg.open) dlg.close(); }

  window.nabiPalette = { open, close };
  for (const b of document.querySelectorAll<HTMLElement>("[data-palette]")) b.addEventListener("click", (ev) => { ev.preventDefault(); open(); });
})();

// a module to the type checker; the bundle (tools/build.ts) drops it
export {};
