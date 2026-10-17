/**
 * Hand-off for a photo or clip captured by the in-app camera.
 *
 * The capture screen is a modal route, so the result travels back through this
 * one-slot store rather than router params: `router.back()` cannot carry them,
 * and a global would leak between sessions.
 */

export interface CapturedMedia {
  uri: string;
  kind: 'photo' | 'video';
}

let pending: CapturedMedia | null = null;

/** Set by the camera screen when a capture succeeds. */
export const setPendingCapture = (capture: CapturedMedia) => {
  pending = capture;
};

/** Takes the capture if there is one, clearing the slot. */
export const takePendingCapture = (): CapturedMedia | null => {
  const capture = pending;
  pending = null;
  return capture;
};

/** Peeks without clearing, for render-time checks. */
export const peekPendingCapture = (): CapturedMedia | null => pending;