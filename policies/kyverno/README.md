# Kyverno Policies

Guardrails for the lab.

## Policy Goals

- require CPU and memory requests
- require resource limits
- block privileged or non-root-incompatible containers
- allow only approved image registries
- keep tenant boundaries explicit

## Lab Flow

1. apply policy
2. deploy valid manifest
3. try invalid manifest
4. show reject event and fix

