export default function Blobs() {
  return (
    <>
      <div className="blob" style={{ width: 220, height: 220, background: "var(--pink)", top: -40, insetInlineStart: -60 }} />
      <div className="blob" style={{ width: 260, height: 260, background: "var(--mint)", top: 180, insetInlineEnd: -80, animationDelay: "2s" }} />
      <div className="blob" style={{ width: 200, height: 200, background: "var(--yellow)", bottom: 60, insetInlineStart: -50, animationDelay: "4s" }} />
      <div className="blob" style={{ width: 180, height: 180, background: "var(--purple)", bottom: -40, insetInlineEnd: 20, animationDelay: "1s" }} />
    </>
  );
}
