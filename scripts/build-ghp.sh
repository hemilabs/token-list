#!/usr/bin/env sh

set -e

rm -rf public

mkdir public
cp -r src/hemi.tokenlist.json src/logos scripts/assets public

node scripts/build-ghp-index.js
