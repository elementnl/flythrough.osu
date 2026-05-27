// Shared camera animation state. Imported as a singleton by both controls.js
// and coursePool.js so flyToCourse can set targets that tickControls reads.
export const rig = {
  yaw:           0,
  pitch:         0,
  flyOrigin:     null,
  flyControl:    null,
  flyTarget:     null,
  flyT:          1,
  flyTargetSlot: -1,
  flyStartTime:  -1,   // ms from performance.now(), for frame-rate-independent animation
  flyDuration:   2630, // ms
};
