// What the kit's scripts put on window for the sites' own scripts.
interface Window {
  /** copy.ts: run `change`, then ease `el`'s size from the old to the new. */
  nabiResize?: (el: HTMLElement, change: () => void) => void;
}
