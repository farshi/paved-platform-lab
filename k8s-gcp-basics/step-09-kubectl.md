# Step 9: kubectl

## What kubectl is

`kubectl` is the command-line tool for Kubernetes.

You use it to:

- create resources
- check status
- view logs
- delete resources

## Simple meaning

`kubectl` is your remote control for Kubernetes.

## Example commands

```bash
kubectl get pods
kubectl get deployments
kubectl describe pod my-pod
kubectl logs my-pod
kubectl apply -f app.yaml
```

## Why it matters

`kubectl` is how you ask the cluster what is happening.

## Easy words

- **CLI**: command-line interface
- **kubectl**: Kubernetes command tool

## Small example flow

```text
you type kubectl
  -> API server gets request
  -> Kubernetes reads or changes cluster state
```

## Real-life example

If a Pod is failing:

- use `kubectl get pods`
- use `kubectl describe pod`
- use `kubectl logs`

That is the normal first check path.

