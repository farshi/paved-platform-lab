# Step 1: From code to container image

## Flow

```text
code -> container image -> image registry -> Kubernetes
```

## Simple meaning

- You write app code.
- You build a container image.
- You push the image to a registry.
- Kubernetes pulls the image and runs it in a Pod.

## Example

For a Node.js app:

- code lives in `app.js`
- `Dockerfile` tells how to package it
- `docker build` makes an image like `myapp:v1`
- `docker push` sends it to **Artifact Registry** in GCP
- GKE later pulls that image and starts it

## Easy words

- **Container image**: a ready package with your app and what it needs.
- **Registry / repository**: a place to store container images.
- In GCP, this is usually **Artifact Registry**.

## Small example flow

```text
Developer laptop
  -> docker build
  -> Artifact Registry
  -> GKE cluster pulls image
  -> Pod runs container
```

## Why this matters

Kubernetes does not usually build your app. It runs images that are already built and stored somewhere.

