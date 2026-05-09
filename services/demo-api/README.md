# Demo API

Sample API service for the lab.

## Purpose

This is the workload used to demonstrate:

- safe deployment
- policy rejection
- runtime breakage
- rollback
- metrics, logs, and traces

## Phase 1

Keep it small and easy to reason about.

## Files

- `app.py` - HTTP API used by the lab
- `Dockerfile` - local image build for the demo
- `requirements.txt` - Python dependencies
- `manifests/base` - base Kubernetes manifests
