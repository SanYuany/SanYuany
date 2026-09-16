# V5.1.1 — same house, outside to inside

Builds on verified 4d88252 V5.1 source. Does not change the approved four chapters or product claims.

- Complete exterior and cutaway now morph in place. Roof lifts as facade transparency changes. Orbit and camera remain at the same location during a user-triggered view change.
- Exterior-first entry from the hero. After revealing the plan, accessible room labels attach to 3D coordinates; selecting one moves the actual camera into the corresponding room.
- Reduced-motion toggles immediately. Entering a room or isolating a floor removes the envelope immediately to avoid foreground wall obstruction.
- New deterministic regression tests verify elapsed-time interpolation, interruption/reversal, and reduced-motion isolation.

This remains a stylized architectural concept, not CAD-accurate product geometry or the original AI-video-chain Scroll World pipeline. Public deployment is a separate gate, never implied by archive delivery.

## Visual regression correction
The complete mobile exterior preset was being clamped to the old 37-unit orbit maximum. Preset-aligned orbit limits and fog now preserve the full property in portrait. Breakpoint changes reframe the exterior. Architecture controls sit below the product/fullscreen toolbar rather than overlapping it.
