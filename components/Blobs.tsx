/**
 * .blob-wrap / .blob are deliberately two nested elements, not one —
 * see app/globals.css. Putting `animation` (a transform) and `filter:
 * blur()` on the SAME element is a known WebKit rendering bug: Safari
 * sometimes fails to correctly recompose the blur against the
 * border-radius on every animation frame, and very briefly shows the
 * shape's raw square bounding box instead of the rounded blurred blob
 * — worse on weaker mobile GPUs, which is also why it can look
 * pixelated rather than just square. Splitting the animated transform
 * (outer, never blurred) from the shape/blur (inner, never transformed)
 * means the blur only ever has to be computed against a completely
 * static box, sidestepping the bug entirely rather than working around
 * its symptoms.
 */
export default function Blobs() {
  return (
    <>
      <div className="blob-wrap" style={{ width: 220, height: 220, top: -40, insetInlineStart: -60 }}>
        <div className="blob" style={{ background: "var(--pink)" }} />
      </div>
      <div className="blob-wrap" style={{ width: 260, height: 260, top: 180, insetInlineEnd: -80, animationDelay: "2s" }}>
        <div className="blob" style={{ background: "var(--mint)" }} />
      </div>
      <div className="blob-wrap" style={{ width: 200, height: 200, bottom: 60, insetInlineStart: -50, animationDelay: "4s" }}>
        <div className="blob" style={{ background: "var(--yellow)" }} />
      </div>
      <div className="blob-wrap" style={{ width: 180, height: 180, bottom: -40, insetInlineEnd: 20, animationDelay: "1s" }}>
        <div className="blob" style={{ background: "var(--purple)" }} />
      </div>
    </>
  );
}
