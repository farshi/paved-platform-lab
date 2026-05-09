#!/bin/sh
set -eu

if command -v helm >/dev/null 2>&1; then
  echo "helm: ok"
  exit 0
fi

echo "helm: installing"
brew install helm
