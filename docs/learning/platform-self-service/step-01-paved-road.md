# Paved Road

## Concept

A paved road is the easiest supported path for teams to build, deploy, observe, and recover a service.

## Simple Meaning

Teams get commands, templates, manifests, policies, dashboards, and runbooks in one route.

## Why Teams Care

The safe path should be faster than improvising. Otherwise teams bypass the platform.

## Runnable Example

```sh
make install
make bootstrap
make build
make install-addons
make deploy
make tools-up
```

## What Can Go Wrong

If every team invents its own path, platform rules become tribal knowledge and production behavior becomes inconsistent.

## Platform Guardrail Or Best Practice

Publish one clear path first. Add choices only when the default path is understood.

## Checkpoint

Which repo files make the paved road visible without asking a platform engineer?

## Lab Link

- Platform story: [../../runbooks/platform-as-a-service.md](../../runbooks/platform-as-a-service.md)
- Service template: [../../../templates/service](../../../templates/service)
