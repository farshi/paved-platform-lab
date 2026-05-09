#!/bin/sh
set -eu

if command -v yq >/dev/null 2>&1; then
  echo "yq: ok"
  exit 0
fi

echo "yq: installing"
brew install yq
