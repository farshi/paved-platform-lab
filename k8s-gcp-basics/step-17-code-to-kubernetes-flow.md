# Step 17: Code to Kubernetes Flow

## Full path

```text
code
  -> Dockerfile
  -> container image
  -> Artifact Registry
  -> Kubernetes Deployment
  -> Pod
  -> Service
  -> user traffic
```

## What happens step by step

1. You write app code.
2. You build a container image.
3. You push the image to a registry.
4. You update a Deployment to use that image.
5. Kubernetes creates Pods from the Deployment.
6. A Service sends traffic to the Pods.

## Simple meaning

Kubernetes usually runs an image that is already built.
It does not start from source code directly.

## Example

For a Python API:

- code is in Git
- CI/CD builds image `api:v3`
- image goes to Artifact Registry
- Deployment points to `api:v3`
- GKE pulls image and starts Pods

## Why this matters

This is the chain to explain when walking someone through the platform path.
It shows you understand build, storage, and runtime.

## Easy words

- **Dockerfile**: instructions to build the image
- **Artifact Registry**: place where images are stored
- **Deployment**: Kubernetes object that runs Pods

## Real-life example

If version 4 is bad:

- update Deployment back to version 3
- Kubernetes starts old image again
- traffic keeps flowing through the Service
