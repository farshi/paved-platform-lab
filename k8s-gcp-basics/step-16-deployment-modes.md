# Step 16: Deployment Modes

## What deployment mode means

Deployment mode means how you move from the old app version to the new app version.

## Main modes

- **Rolling update**
- **Recreate**
- **Blue/green**
- **Canary**

## 1) Rolling update

Old Pods are replaced slowly with new Pods.

### Example

- start with 3 old Pods
- Kubernetes replaces 1 old Pod with 1 new Pod
- then the next one
- traffic keeps flowing

### Simple meaning

No big stop. Small changes step by step.

## 2) Recreate

Old version stops first. New version starts after.

### Example

- stop all version 1 Pods
- start version 2 Pods
- users may see downtime

### Simple meaning

Easy, but risky for live users.

## 3) Blue/green

You keep two versions ready:

- **blue** = old live version
- **green** = new version

Then switch traffic.

### Example

- blue serves users
- green is tested
- traffic changes from blue to green

### Simple meaning

Fast switch and easy rollback.

## 4) Canary

You send small traffic to the new version first.

### Example

- 10% traffic to new version
- if healthy, move to 50%
- then 100%

### Simple meaning

Test with a small group before full release.

## Why this matters

Deployment mode changes risk level.

- Rolling update = safe and common
- Recreate = simplest, but downtime risk
- Blue/green = strong rollback option
- Canary = best for gradual risk check

## Easy words

- **Rollout**: moving a new version into use
- **Rollback**: going back to the old version

## Small example flow

```text
new image ready
  -> choose deployment mode
  -> release new version
  -> watch health
  -> keep or rollback
```

## Real-life example

For a bank API:

- use rolling update for low-risk changes
- use canary for risky payment changes
- use blue/green when you want a very fast rollback

