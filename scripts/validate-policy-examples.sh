#!/bin/sh
set -eu

check_pass() {
  path="$1"
  printf 'pass: %s\n' "$path"
  kubectl apply -k "$path" --dry-run=server >/dev/null
}

check_fail() {
  path="$1"
  policy="$2"
  tmp_file="$(mktemp)"
  printf 'fail: %s -> %s\n' "$path" "$policy"
  if kubectl apply -k "$path" --dry-run=server >"$tmp_file" 2>&1; then
    cat "$tmp_file"
    rm -f "$tmp_file"
    printf 'expected policy rejection but manifest passed\n'
    exit 1
  fi
  if ! grep -q "$policy" "$tmp_file"; then
    cat "$tmp_file"
    rm -f "$tmp_file"
    printf 'expected policy %s in rejection\n' "$policy"
    exit 1
  fi
  rm -f "$tmp_file"
}

check_pass examples/policy/pass
check_fail examples/policy/fail-approved-registry approved-image-registry
check_fail examples/policy/fail-missing-resources require-container-resources
check_fail examples/policy/fail-nonroot require-nonroot-containers

printf 'policy examples: ok\n'
