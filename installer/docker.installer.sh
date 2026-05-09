#!/bin/sh
set -eu

if command -v docker >/dev/null 2>&1; then
  echo "docker: cli ok"
else
  echo "docker: installing docker cli and colima"
  brew install docker colima
fi

if docker info >/dev/null 2>&1; then
  echo "docker: runtime ok"
  exit 0
fi

if command -v colima >/dev/null 2>&1; then
  echo "docker: runtime not running; starting colima"
  colima start
fi

if docker info >/dev/null 2>&1; then
  echo "docker: runtime ok"
  exit 0
fi

echo "docker: runtime unavailable"
echo "Start Docker Desktop or run: colima start"
exit 1
