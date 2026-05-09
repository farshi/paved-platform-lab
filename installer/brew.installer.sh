#!/bin/sh
set -eu

if command -v brew >/dev/null 2>&1; then
  echo "brew: ok"
  exit 0
fi

echo "brew: missing"
echo "Install Homebrew first: https://brew.sh"
exit 1
