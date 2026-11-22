// Copy buttons of the Nabi sites: a button with data-copy puts that text
// on the clipboard, one with data-copy-from="<selector>" copies that
// element's text as it is at click time. The button says "Copied" for a
// moment (in the page's language), or how to copy by hand where the
// clipboard is refused; a live region announces it. Load it with `defer`.
//
// It also gives the sites window.nabiResize(el, change): run change(), then
// ease el's width and height from what they were to what they are now
// (nabi.css motion), unless the reader asked for reduced motion.
import { lang, type Code } from "./lang/lang.ts";

(() => {
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const runs = new WeakMap<Element, Animation>();
  // offsetWidth/Height are border-box; width/height may not be
  function inner(el: Element, w: number, h: number): [number, number] {
    const cs = getComputedStyle(el);
    if (cs.boxSizing === "border-box") return [w, h];
    const px = (v: string): number => parseFloat(v) || 0;
    return [w - px(cs.paddingLeft) - px(cs.paddingRight) - px(cs.borderLeftWidth) - px(cs.borderRightWidth),
      h - px(cs.paddingTop) - px(cs.paddingBottom) - px(cs.borderTopWidth) - px(cs.borderBottomWidth)];
  }
  function resize(el: HTMLElement, change: () => void): void {
    // measured mid-flight, so a second call carries on from where the
    // first one has got to
    const r0 = el.getBoundingClientRect();
    runs.get(el)?.cancel();
    change();
    const r1 = el.getBoundingClientRect();
    if ((r0.width === r1.width && r0.height === r1.height) || still.matches) return;
    const [aw, ah] = inner(el, r0.width, r0.height), [bw, bh] = inner(el, r1.width, r1.height);
    const from: Keyframe = { overflow: "hidden" }, to: Keyframe = { overflow: "hidden" };
    if (r0.width !== r1.width) { from.width = aw + "px"; to.width = bw + "px"; }
    if (r0.height !== r1.height) { from.height = ah + "px"; to.height = bh + "px"; }
    const run = el.animate([from, to], { duration: 180, easing: "cubic-bezier(.2,0,0,1)" });
    runs.set(el, run);
    run.onfinish = () => runs.delete(el);
  }
  window.nabiResize = resize;

  const SAY: Record<Code, { done: string; press: (k: string) => string }> = {
    en: { done: "Copied", press: (k) => "Press " + k },
    ko: { done: "복사됨", press: (k) => k + "를 누르세요" },
    "zh-Hans": { done: "已复制", press: (k) => "请按 " + k },
    "zh-Hant": { done: "已複製", press: (k) => "請按 " + k },
  };
  const t = SAY[lang()];
  function press(): string {
    return t.press(/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘C" : "Ctrl+C");
  }
  let live: HTMLSpanElement | undefined;
  function say(msg: string): void {
    if (!live) {
      live = document.createElement("span");
      live.className = "sr-only";
      live.setAttribute("aria-live", "polite");
      document.body.appendChild(live);
    }
    const el = live;
    el.textContent = "";
    setTimeout(() => { el.textContent = msg; }, 50);
  }
  document.addEventListener("click", (ev) => {
    const b = ev.target instanceof Element ? ev.target.closest<HTMLButtonElement>("button[data-copy], button[data-copy-from]") : null;
    if (!b) return;
    const src = b.dataset.copyFrom ? document.querySelector<HTMLElement>(b.dataset.copyFrom) : null;
    const text = src ? src.innerText : (b.dataset.copy ?? "");
    const label = b.dataset.label || b.textContent || "";
    b.dataset.label = label;
    const done = (msg: string): void => {
      resize(b, () => { b.textContent = msg; });
      say(msg);
      b.classList.add("done");
      setTimeout(() => {
        resize(b, () => { b.textContent = label; });
        b.classList.remove("done");
      }, 1600);
    };
    if (!navigator.clipboard) { done(press()); return; }
    navigator.clipboard.writeText(text).then(() => done(t.done), () => done(press()));
  });
})();

// the import makes it a module; the bundle (tools/build.ts) is a script
