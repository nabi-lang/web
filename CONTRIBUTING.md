# Contributing to the Nabi web kit

This repository is what the four Nabi sites share: design tokens and
components (`css/nabi.css`), the page scripts (`js/`), the marks and fonts
(`assets/`), the Nabi library of the servers (`nabi/`) and the content tool
(`tools/content`). Each site has it as a submodule at `web/`, so a change
here reaches a site only when its submodule is moved.

## Development

```sh
npm ci
npm run build                    # js/*.ts to the .js beside each
npm run check                    # tsc
(cd nabi && nabi test && nabi fmt --check)
(cd tools/content && nabi build --release)
```

Read `docs/tokens.md` before changing a token or a component: it lists every
token's role and contrast, and the rules in the README apply (one type
scale, light and dark designed separately, no infrastructure details here).
The marks in `assets/brand/` are copied from nabi-lang/nabi `assets/` by
`tools/brand.sh`; change them there, not here.

To see a change, build a site against your checkout: in a clone of
nabi-lang.org or packages.nabi-lang.org, point its `web/` submodule at your
branch and follow its README.

## Submitting

Open a pull request against `main` with the checks above passing. Say which
sites the change affects and how it looks in light and dark (a screenshot
helps). By contributing you agree that your work is licensed under both MIT
and Apache-2.0, the project's dual license.

## Sign your work

Nabi uses the [Developer Certificate of Origin 1.1](https://developercertificate.org/)
(DCO) instead of a CLA. By adding a `Signed-off-by` line to a commit you
certify that you wrote the change, or otherwise have the right to submit it
under this repository's license. `git commit -s` adds the line:

```text
Signed-off-by: Your Name <you@example.com>
```

Use your name and an email you can be reached at; the email must be the
commit's author email. The `DCO / Check sign-off` check fails a pull request with an
unsigned commit. To fix it, run `git commit --amend -s` (last commit) or
`git rebase --signoff main` (every commit), then push again. The full text
of the DCO is in the
[organization's CONTRIBUTING.md](https://github.com/nabi-lang/.github/blob/main/CONTRIBUTING.md#developer-certificate-of-origin).
