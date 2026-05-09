#!/bin/sh
set -eu

if command -v jq >/dev/null 2>&1; then
  echo "jq: ok"
  exit 0
fi

echo "jq: installing"
brew install jq
