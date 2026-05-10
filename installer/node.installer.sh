#!/bin/sh
set -eu

if command -v node >/dev/null 2>&1; then
  echo "node: ok"
  exit 0
fi

echo "node: installing"
brew install node
