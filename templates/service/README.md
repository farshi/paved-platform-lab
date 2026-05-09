# Service Template

Use this folder as the source for a new team service.

## Template Inputs

- service name
- namespace
- container image
- service port
- resource requests and limits

## Template Outputs

- deployment manifest
- service manifest
- ingress manifest
- baseline labels and annotations
- probes and resource limits

## Teaching Point

This is the safe golden path. New teams should start here, then customize only within the guardrails.

## Placeholder Tokens

- `__SERVICE_NAME__`
- `__NAMESPACE__`
- `__IMAGE__`
- `__TENANT__`
- `__SERVICE_ACCOUNT__`
- `__PORT__`
