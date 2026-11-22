// The page's language, as the Nabi sites write <html lang>, and what a
// search needs to know of Chinese text. Pages import it; the bundle
// (tools/build.ts) takes it into each script.

/** The sites' languages (web::lang::Lang). */
export type Code = "en" | "ko" | "zh-Hans" | "zh-Hant";

/** The language of this page; any other `lang` is English. */
export const lang = (): Code => {
  const l = document.documentElement.lang;
  return l === "ko" || l === "zh-Hans" || l === "zh-Hant" ? l : "en";
};

/** A language's directory under a site root: "", "ko/", "zh-hans/", "zh-hant/". */
export const dir = (c: Code): string => (c === "en" ? "" : c.toLowerCase() + "/");

const LEAD = /^(ko|zh-hans|zh-hant)(?:\/|$)/;

/** The language directory path `p` starts with (`zh-hans/learn` -> "zh-hans/"), or "". */
export const dirOf = (p: string): string => {
  const m = LEAD.exec(p);
  return m ? m[1] + "/" : "";
};

/** `p` without the language directory it starts with. */
export const bare = (p: string): string => {
  const m = LEAD.exec(p);
  return m ? p.slice(m[0].length) : p;
};

/** One Han character: the CJK ideographs, their extension A and the
 * compatibility ones. */
export const HAN = /[㐀-䶿一-鿿豈-﫿]/;
const HAN_RUN = /[㐀-䶿一-鿿豈-﫿]+/g;

/** A query term as the text index holds Han text (search.nabi): each run
 * of Han characters as its two-character pieces, a run of one as
 * itself; the rest of the term as it is. "list的方法" -> ["list", "的方",
 * "方法"]. */
export const hanTerms = (term: string): string[] => {
  if (!HAN.test(term)) return [term];
  const out: string[] = [];
  for (const part of term.split(HAN_RUN)) if (part) out.push(part);
  for (const run of term.match(HAN_RUN) || []) {
    const cs = [...run];
    if (cs.length === 1) out.push(run);
    for (let k = 0; k + 1 < cs.length; k++) out.push(cs[k]! + cs[k + 1]!);
  }
  return out;
};

/** How much a query says: a Hangul syllable or a Han character about as
 * much as a short Latin word's two or three letters. */
export const weight = (s: string): number => [...s].reduce((n, c) => n + (HAN.test(c) ? 3 : /[ㄱ-힣]/.test(c) ? 2 : 1), 0);
