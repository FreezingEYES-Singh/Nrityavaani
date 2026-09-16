# Hand model asset

`hand.glb` is the source asset, committed as-is. Nothing here is generated, so
there is no build step to re-run.

## What it is

A low-poly right hand, about 2.1k triangles, carrying a real skeleton: 23 joints
with `JOINTS_0`/`WEIGHTS_0` skin weights. The bone chains line up with
MediaPipe's 21-landmark layout closely enough to drive one from the other.

The hierarchy runs `_rootJoint` → `L_Hand_00` (the wrist) → `L_Hand_Palm_01` →
`L_Hand_Fingers_02`, with the four fingers branching off the finger hub and the
thumb branching earlier, off the palm.

One quirk is worth knowing before touching `handRig.ts`: **the thumb is a bone
short, and it is short at the base.** Its three bones are the knuckle, the
interphalangeal joint and the tip, so the landmark with nothing behind it is 1,
the carpal joint, which the rig interpolates along the wrist-to-knuckle line.

It is easy to get this backwards and assume the missing joint is the tip, since
the thumb visibly hangs off the palm well below the other knuckles. The test
that settles it is how much flesh a bone carries past its own origin: a tip
marker holds only the fingertip cap, reaching about 0.2 of a segment beyond
itself, where a mid joint drags a whole phalanx, around 0.9. Measured against
the skin weights, `L_Hand_Thumb_3_021` comes out at 0.14 over 79 vertices,
squarely with the tips.

## How it is driven

Poses are **baked, not solved at runtime**. `scripts/build-mudra-poses.mjs`
reads this GLB, applies the authored joint angles for each mudra, and writes
21 landmark coordinates per mudra to `src/lib/constants/mudraPoses.json`:

```bash
npm run build:poses
```

Re-run it after touching the angles or replacing the model. It re-checks every
pose against the rules in `src/lib/mediapipe/classification.ts` — the same
extension scores and contact distances the live classifier uses — and exits
non-zero rather than writing a pose its own classifier would not recognise.

The coordinates are generated from *this model's* knuckle anchors and bone
lengths, not an idealised hand. That is what lets the glowing overlay sit on
the mesh. `src/components/three/handRig.ts` aims each bone along the direction
its landmark pair implies, rather than snapping bones to absolute positions, so
the model keeps its own proportions and only adopts the pose; the overlay then
reads its joint positions back out of the posed skeleton.

Two limits are the model's own and cannot be posed away: its palm is long and
its distal phalanges run about 0.60 of the proximal where a real hand is 0.39,
so the fingers read shorter than the reference photographs; and its thumb has
no carpal joint, so Mayura's thumb-to-ring contact needs an unusually wide
abduction to reach at all.

Aiming happens in world space while the solver works in root space, so
directions are carried across with `transformDirection` before use. Getting that
wrong makes the fingers skew as the hand sways, which is the failure mode to
look for if the pose ever starts swimming.

## Licence and attribution

CC BY 4.0 — commercial use allowed, **author must be credited**. Full text in
`hand-license.txt`.

The required credit is rendered site-wide in
`src/components/layout/Footer.tsx`. If the footer is ever restructured, the
credit has to survive, or the licence is breached.

> "Low-Poly Hand With Animation"
> (https://sketchfab.com/3d-models/low-poly-hand-with-animation-33253439b0874d09b46a9a18685c863c)
> by volkanongun (https://sketchfab.com/volkanongun)
> licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/)
