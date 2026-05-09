# Service Template

Use this folder as the source for a new team service.

## Template Inputs

- service name
- namespace
- container image
- service version
- service port
- resource requests and limits

## Template Outputs

- deployment manifest
- service manifest
- ingress manifest
- baseline labels and annotations
- probes and resource limits
- non-root container security context
- pod seccomp profile
- OpenTelemetry endpoint environment variable

## Guardrail Defaults

Generated services should keep these defaults unless there is a clear reason to change them:

- image from approved registry
- CPU and memory requests
- CPU and memory limits
- readiness probe on `/readyz`
- liveness probe on `/healthz`
- `runAsNonRoot: true`
- `allowPrivilegeEscalation: false`
- drop all Linux capabilities
- `seccompProfile: RuntimeDefault`

## Teaching Point

This is the safe golden path. New teams should start here, then customize only within the guardrails.

## Placeholder Tokens

- `__SERVICE_NAME__`
- `__NAMESPACE__`
- `__IMAGE__`
- `__SERVICE_VERSION__`
- `__TENANT__`
- `__SERVICE_ACCOUNT__`
- `__PORT__`
