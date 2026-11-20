// Build the page scripts: each `<name>.ts` or `<name>.tsx` directly in
// the given directories becomes `<name>.js` beside it, one
// self-contained file (esbuild: types erased, JSX for Preact, imports
// bundled in). Files in subdirectories are modules the pages import, not
// pages. A page is a classic script (an IIFE); one that imports a URL
// (`from "/nabi.mjs"`, the playground's worker) stays an ES module that
// imports it at run time.
// Run it before `nabi build`: the kit and the sites build the .js in.
//
//   node web/tools/build.ts web/js static
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { build } from "esbuild";

const dirs = process.argv.slice(2);
if (dirs.length === 0) {
  console.error("usage: node tools/build.ts <dir>...");
  process.exit(2);
}
let n = 0;
for (const dir of dirs) {
  for (const name of readdirSync(dir)) {
    if (!/\.tsx?$/.test(name) || name.endsWith(".d.ts")) continue;
    const file = join(dir, name);
    const esm = /^import .* from "\//m.test(readFileSync(file, "utf8"));
    await build({
      entryPoints: [file],
      outfile: join(dir, name.replace(/\.tsx?$/, ".js")),
      bundle: true,
      format: esm ? "esm" : "iife",
      // a URL import ("/nabi.mjs") is the page's to load; everything
      // else, Preact and ./ui/ included, is bundled
      plugins: [{
        name: "url",
        setup(b) {
          b.onResolve({ filter: /^\// }, (a) => (a.kind === "entry-point" ? undefined : { path: a.path, external: true }));
        },
      }],
      target: "es2022",
      jsx: "automatic",
      jsxImportSource: "preact",
      minify: true,
      legalComments: "none",
      logLevel: "warning",
    });
    n++;
  }
}
console.log(`${n} scripts`);
