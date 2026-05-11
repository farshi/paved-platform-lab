#!/bin/sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

echo "install: checking lab prerequisites"

sh "$ROOT_DIR/installer/brew.installer.sh"
sh "$ROOT_DIR/installer/docker.installer.sh"
sh "$ROOT_DIR/installer/kubectl.installer.sh"
sh "$ROOT_DIR/installer/k3d.installer.sh"
sh "$ROOT_DIR/installer/helm.installer.sh"
sh "$ROOT_DIR/installer/node.installer.sh"
sh "$ROOT_DIR/installer/jq.installer.sh"
sh "$ROOT_DIR/installer/yq.installer.sh"
sh "$ROOT_DIR/installer/kyverno.installer.sh"
sh "$ROOT_DIR/installer/argocd.installer.sh"

echo "install: done"
echo "next: make bootstrap"
echo "then: make install-addons"
