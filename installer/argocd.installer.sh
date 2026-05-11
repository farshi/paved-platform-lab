#!/bin/sh
set -eu

if command -v argocd >/dev/null 2>&1; then
  echo "argocd: ok"
  exit 0
fi

echo "argocd: installing"
brew install argocd
