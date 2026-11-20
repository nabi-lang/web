// The search shortcut of the Nabi sites: `/`, Ctrl+K or Cmd+K focuses the
// search field, the input that names them in aria-keyshortcuts. Load it
// with `defer` on pages with a search field.
document.addEventListener("keydown", (ev) => {
  const q = document.querySelector<HTMLInputElement>("input[aria-keyshortcuts]");
  if (!q) return;
  const key = ev.key || "";
  const typing = ev.target instanceof Element && ev.target.closest("input, textarea, select, [contenteditable]");
  const slash = key === "/" && !typing && !ev.metaKey && !ev.ctrlKey && !ev.altKey;
  // ev.code too: with Caps Lock or a Korean IME the key is "K" or "ㅏ".
  const k = (ev.code === "KeyK" || key.toLowerCase() === "k") && (ev.metaKey || ev.ctrlKey) && !ev.altKey && !ev.shiftKey;
  if (!slash && !k) return;
  ev.preventDefault();
  // A search box that opens on click (the docs' narrow header) opens first.
  q.closest<HTMLElement>(".search")?.click();
  q.focus();
  q.select();
});

// a module to the type checker; the bundle (tools/build.ts) drops it
export {};
