#!/bin/sh
set -eu

if command -v k3d >/dev/null 2>&1; then
  echo "k3d: ok"
  exit 0
fi

echo "k3d: installing"
brew install k3d
