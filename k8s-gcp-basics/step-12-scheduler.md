# Step 12: Scheduler

## What the Scheduler is

The **scheduler** chooses a node for a Pod.

It looks at:

- available CPU
- available memory
- node rules
- taints and tolerations
- labels and node selectors

## Simple meaning

The scheduler is the placement brain.

## Example

If one node has enough memory and another does not:

- scheduler picks the node that fits the Pod best

## Why it matters

Scheduling decides where the app runs.
Bad scheduling can leave Pods stuck in `Pending`.

## Easy words

- **Schedule**: choose where to run
- **Pending**: waiting to be placed on a node

## Small example flow

```text
Pod created
  -> scheduler checks nodes
  -> best node chosen
  -> Pod starts there
```

## Real-life example

If a Pod asks for 4 CPU and no node has 4 CPU free:

- scheduler cannot place it
- Pod stays pending
- cluster autoscaler may add more nodes

