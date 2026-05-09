#!/bin/sh
set -eu

if command -v kubectl >/dev/null 2>&1; then
  echo "kubectl: ok"
  exit 0
fi

echo "kubectl: installing"
brew install kubectl
