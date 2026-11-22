# Nabi web kit

[![License: MIT OR Apache-2.0](https://img.shields.io/badge/license-MIT%20OR%20Apache--2.0-blue)](LICENSE-MIT)

*Clear rules, free as a butterfly.*

What nabi-lang.org, docs.nabi-lang.org, packages.nabi-lang.org and playground.nabi-lang.org share: design tokens and components, the theme and search scripts, the marks and icons, and the server and page code of the three Nabi servers.

- `css/nabi.css`: tokens (plain light and dark blocks, so a theme is a class), type steps, font fallbacks, components, theme controls, footer
- `docs/tokens.md`: how the tokens work, every token's role, values and contrast, the type scale, the theme contract and the rules
- `js/theme.ts`: light and dark, loaded blocking in `<head>`: the class before the first paint, then the header toggle and the footer switch
- `js/keys.ts`: Ctrl+K and Cmd+K open the search palette where the page has it, else focus the search field; `/` focuses the field (the palette where there is none)
- `js/palette.tsx`: the search palette (`chrome::palette_button`, `chrome::palette_script`): a modal dialog over the docs of one version, the standard library, the packages and the examples, results grouped Docs / Std / Packages / Examples. It reads the docs' `search-index.json`, the package docs' `search-api.json` and the registry's `GET /api/v1/docs?format=json`, each once, when first needed
- `js/copy.ts`: Copy buttons (`button[data-copy]`, `chrome::copy_button`)
- `assets/brand/`: the mark, the wordmark (light and dark), the favicons, app icons and `site.webmanifest`, copied by `tools/brand.sh` from the toolchain repository's `assets/`, the one source of every Nabi mark; `assets/brand/download/`: the files nabi-lang.org/brand offers (the mark, the app icons, the wordmarks, SVG and PNG; `kit::BRAND_DIR`, copied like the fonts); `assets/fonts/`: the self-hosted webfonts (Geist, Geist Mono, Pretendard) and their licenses
- `nabi/`: the `web` Nabi library the three servers build with: `http` (HTTP/1.1, forms, cookies, static files, fingerprints and ETags), `url` (canonical addresses and their 301s), `kit` (the files above and the fonts, built into the program), `chrome` (a page's `<head>`, theme controls, social links, the bar of sites, the footer and its shared bottom row, the Copy button, the 404 body, the `<head>` lines for fonts and icons), `build` (the generators' helpers: writing the output tree, PNG sizes, JSON strings, cutting text, the attribute scan of the link checks), `apidoc` (the scanner behind the API pages: `pub` items, docs, signatures, members and their source lines; `apidoc::nav`, the API pages' breadcrumb, sidebar and "On this page", whose markup `nabi doc` shares)
- `tools/content`: `nabi-content`, which bundles the docs, www and spec repositories for the nabi-lang.org server
- `tools/snippets`: the ` ```nabi ` block checks `nabi-content check` and nabi-lang.org's `nabi run -- check` share (`build`, `norun`, `output`, `text check=`): blocks run in parallel under a 60 s limit, a block that runs over is killed with everything it started, and the work directory under the system temp directory keeps only the blocks that still exist, at most 1 GB; a library of its own, since `web` builds the kit's scripts in

## How the sites use it

Each site repository has this one as a git submodule at `web/`, pinned to a commit, and depends on the library by path:

```nabion
deps: {
    "web": Dep::path("web/nabi"),
},
```

`web::kit` builds the published files into the program, so a generator writes them into its output and a server answers with them, at the names pages already use: `/nabi.css`, `/theme.js`, `/keys.js`, `/copy.js`, `/palette.js`, `/logo.svg`, the favicons and app icons, and `/site.webmanifest`; every site wears the same mark. The webfonts are the exception: 3 MB of files, too much to build in, so a site copies `web/assets/fonts` to `/fonts/` (`kit::copy_fonts`) or serves that directory. Deploys need nothing else from `web/` at run time; packages.nabi-lang.org's Open Graph templates read `web/css/nabi.css` and the wordmark from the checkout.

Clone a site with its submodule, and bump the kit by moving the submodule:

```sh
git clone --recurse-submodules https://github.com/nabi-lang/nabi-lang.org.git
git submodule update --init          # in a clone made without it
git submodule update --remote web    # take this repository's main
git commit -am "chore: bump the web kit"
```

```sh
cd nabi && nabi test                   # the library's tests
```

## Rules

- One type scale; tracking is set by size and never overridden.
- Light and dark are designed separately; terminals and output follow the theme.
- A site never keeps a copy of a file from here: it publishes the kit's.
- No deploy or infrastructure details here: those live in the private infra repository.

## Scripts

`js/*.ts` are the kit's page scripts (theme, search shortcut, copy buttons); `js/globals.d.ts` types what they put on `window` for the sites' own scripts. `npm run build` (`tools/build.ts`, esbuild) bundles each to the `.js` beside it, `npm run check` runs `tsc`. The same tool builds the sites' page scripts, TSX with Preact included. A site runs the same tool over `web/js` and its own `static/` before `nabi build`, since `kit.nabi` builds the `.js` in.
