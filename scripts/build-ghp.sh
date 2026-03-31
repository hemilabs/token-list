#!/usr/bin/env sh

set -e

# Cleanup build folder
rm -rf public
mkdir public

# Copy base assets
cp -r src/hemi.tokenlist.json src/logos src/l1Logos scripts/assets public

# Build index.html
node scripts/build-ghp-index.js

# Extract hemi.json
jq '.tokens[] | select(.symbol == "HEMI" and .chainId == 43111)' src/hemi.tokenlist.json >public/hemi.json
