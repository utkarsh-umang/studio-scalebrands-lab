/**
 * Portrait QA player.
 *
 * Why height-driven sizing instead of `w-full max-w aspect-[9/16] max-h`:
 *   When width is the controlling dimension AND a `max-height` cap applies, the
 *   browser cannot satisfy both — width stays at `w-full` while height clamps to
 *   the max, so the box stops being 9:16. That mis-aspected box then causes
 *   Drive's iframe player to render the actual portrait video off-centre
 *   (a black sliver on one side, a clipped edge on the other).
 *
 * Driving the size from `h-[min(76vh,720px)]` lets `aspect-ratio: 9/16` derive
 * the width, and `max-w-[min(480px,min(100%,92vw))]` keeps the box within its
 * flex parent and the viewport so the 9:16 frame is never squashed horizontally
 * (which shows up as a clipped edge on one side in Drive's embed).
 */
export const qaPortraitPlayerBoxClass =
  'relative mx-auto aspect-[9/16] h-[min(76vh,720px)] max-w-[min(480px,min(100%,92vw))] w-fit shrink-0 overflow-hidden rounded-lg bg-black'

/** Portrait preview inside deliverable accordions (fits modal scroll, same frame as QA video). */
export const deliverablePortraitPlayerBoxClass =
  'relative mx-auto aspect-[9/16] h-[min(48vh,480px)] max-w-[min(360px,min(100%,92vw))] w-fit shrink-0 overflow-hidden rounded-lg bg-black'

/** Native `<video>` inside the portrait box — absolute-fill so flex quirks can't offset it */
export const qaPortraitVideoInnerClass =
  'absolute inset-0 block h-full w-full object-contain object-center'

/** Drive `/preview` iframe inside the portrait box */
export const qaPortraitIframeClass = 'absolute inset-0 block h-full w-full border-0'

/** Chrome around portrait player in modals / review panel */
export const qaPortraitChromeClass =
  'bg-muted/40 border-border flex min-w-0 shrink-0 justify-center overflow-x-auto overflow-y-visible rounded-xl border p-4'
