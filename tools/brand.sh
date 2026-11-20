#!/bin/sh
# Copy the brand files the kit builds in from the toolchain repo's
# assets/ (the one source of every Nabi mark) into assets/brand/.
# usage: tools/brand.sh [path to the nabi repo]
set -eu
src=${1:-../nabi}/assets
dst=$(dirname "$0")/../assets/brand
mkdir -p "$dst"
cp "$src/logo.svg" "$dst/logo.svg"
cp "$src/wordmark/nabi-horizontal-light.svg" "$dst/wordmark-light.svg"
cp "$src/wordmark/nabi-horizontal-dark.svg" "$dst/wordmark-dark.svg"
for f in favicon.ico favicon.svg apple-touch-icon.png icon-192.png icon-512.png \
	icon-maskable-192.png icon-maskable-512.png site.webmanifest; do
	cp "$src/icons/web/$f" "$dst/$f"
done
