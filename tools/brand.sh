#!/bin/sh
# Copy the brand files from the toolchain repo's assets/ (the one source
# of every Nabi mark) into assets/brand/: the ones the kit builds in, and
# under download/ the ones nabi-lang.org/brand offers for download.
# usage: tools/brand.sh [path to the nabi repo]
set -eu
src=${1:-../nabi}/assets
dst=$(dirname "$0")/../assets/brand
mkdir -p "$dst/download"
cp "$src/logo.svg" "$dst/logo.svg"
cp "$src/wordmark/nabi-horizontal-light.svg" "$dst/wordmark-light.svg"
cp "$src/wordmark/nabi-horizontal-dark.svg" "$dst/wordmark-dark.svg"
for f in favicon.ico favicon.svg apple-touch-icon.png icon-192.png icon-512.png \
	icon-maskable-192.png icon-maskable-512.png site.webmanifest; do
	cp "$src/icons/web/$f" "$dst/$f"
done
cp "$src/logo.svg" "$dst/download/nabi-mark.svg"
cp "$src/icons/icon-512-transparent.png" "$dst/download/nabi-mark-512.png"
cp "$src/icons/icon-512-light.png" "$dst/download/nabi-icon-512-light.png"
cp "$src/icons/icon-512-dark.png" "$dst/download/nabi-icon-512-dark.png"
for f in horizontal-light horizontal-dark vertical-light vertical-dark; do
	cp "$src/wordmark/nabi-$f.svg" "$src/wordmark/nabi-$f.png" "$dst/download/"
done
