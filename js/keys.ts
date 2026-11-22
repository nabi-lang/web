// The search shortcuts of the Nabi sites: Cmd+K or Ctrl+K opens the
// search palette where the page loads palette.js, else focuses the search
// field, the input that names the keys in aria-keyshortcuts; `/` focuses
// that field (the palette where there is none). Load it with `defer`.
document.addEventListener("keydown", (ev) => {
  const key = ev.key || "";
  const typing = ev.target instanceof Element && ev.target.closest("input, textarea, select, [contenteditable]");
  // A Chinese IME types the key as "、".
  const slash = (key === "/" || (key === "、" && ev.code === "Slash")) && !typing && !ev.metaKey && !ev.ctrlKey && !ev.altKey;
  // ev.code too: with Caps Lock or a Korean IME the key is "K" or "ㅏ".
  const k = (ev.code === "KeyK" || key.toLowerCase() === "k") && (ev.metaKey || ev.ctrlKey) && !ev.altKey && !ev.shiftKey;
  if (!slash && !k) return;
  const q = document.querySelector<HTMLInputElement>("input[aria-keyshortcuts]");
  const pal = window.nabiPalette;
  if ((k || !q) && pal) {
    ev.preventDefault();
    pal.open();
    return;
  }
  if (!q) return;
  ev.preventDefault();
  // A search box that opens on click (the docs' narrow header) opens first.
  q.closest<HTMLElement>(".search")?.click();
  q.focus();
  q.select();
});

// a module to the type checker; the bundle (tools/build.ts) drops it
export {};
