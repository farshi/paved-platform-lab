#!/bin/sh
set -eu

if command -v kyverno >/dev/null 2>&1; then
  echo "kyverno: ok"
  exit 0
fi

echo "kyverno: installing"
brew install kyverno
