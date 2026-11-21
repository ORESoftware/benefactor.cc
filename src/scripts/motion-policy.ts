/** Strictly side-effect-free capability policy, shared by runtime and tests. */
export interface MotionCapabilities {
  reducedMotion: boolean;
  reducedData: boolean;
  saveData: boolean;
  compactViewport: boolean;
  wideViewport: boolean;
  finePointer: boolean;
}

export interface MotionPolicy {
  animate: boolean;
  parallax: boolean;
  smoothScroll: boolean;
}

/** Any explicit accessibility/data-saving request is a hard stop. */
export function resolveMotionPolicy(caps: MotionCapabilities): MotionPolicy {
  const animate = !caps.reducedMotion && !caps.reducedData && !caps.saveData;
  return {
    animate,
    parallax: animate && !caps.compactViewport,
    smoothScroll: animate && caps.wideViewport && caps.finePointer,
  };
}
