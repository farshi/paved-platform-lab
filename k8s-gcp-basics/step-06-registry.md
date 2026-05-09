# Step 6: Repository / Registry

## What it is

A **container registry** stores container images.

It is where you push images after building them, so Kubernetes can pull them later.

## Simple meaning

Your app is packaged into an image, then stored in a registry.

## Example in GCP

In GCP (Google Cloud Platform), the common registry is:

- **Artifact Registry**

## Example flow

```text
code
  -> docker build
  -> image
  -> Artifact Registry
  -> GKE pulls image
  -> Pod runs it
```

## Why it matters

Kubernetes does not usually build your image.
It needs a place to fetch the image from.

## Easy words

- **Registry**: storage for container images
- **Repository**: a folder-like place inside the registry
- **Artifact Registry**: Google Cloud image storage service

## Real-life example

If you deploy `payments-api:v12`:

- CI/CD builds the image
- pushes it to Artifact Registry
- GKE pulls that exact version

