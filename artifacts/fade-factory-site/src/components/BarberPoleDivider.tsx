export default function BarberPoleDivider() {
  const STRIPE = 18;

  const stripes = [
    `#bf0a0a 0px, #bf0a0a ${STRIPE}px`,
    `#f2f2f2 ${STRIPE}px, #f2f2f2 ${STRIPE * 2}px`,
    `#002868 ${STRIPE * 2}px, #002868 ${STRIPE * 3}px`,
    `#f2f2f2 ${STRIPE * 3}px, #f2f2f2 ${STRIPE * 4}px`,
  ].join(", ");

  return (
    <div style={{ position: "relative", background: "#000", lineHeight: 0 }}>

      {/* Gold top rail */}
      <div style={{
        height: "4px",
        background: "linear-gradient(to right, #5a3e00, #b8860b, #f5c842, #ffe066, #f5c842, #b8860b, #5a3e00)",
        boxShadow: "0 1px 6px rgba(245,200,66,0.45)",
      }} />

      {/* Pole body — overflow hidden clips the oversized inner div */}
      <div style={{ position: "relative", height: "52px", overflow: "hidden" }}>

        {/*
          Inner div is wider than the viewport (overhangs 300px each side).
          We animate translateX by exactly -101.823px (= 72px × √2 = one full
          horizontal period of a -45° repeating gradient with 72px cycle).
          At the loop reset point the pattern is visually identical → no jump.
          transform is GPU-composited → no CPU repaint stutter.
        */}
        <div style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: "-300px",
          right: "-300px",
          backgroundImage: `repeating-linear-gradient(-45deg, ${stripes})`,
          animation: "poleTranslate 0.9s linear infinite",
          willChange: "transform",
        }} />

        {/* Cylindrical depth gradient */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: [
            "linear-gradient(to bottom,",
            "rgba(0,0,0,0.65)  0%,",
            "rgba(0,0,0,0.18)  26%,",
            "rgba(255,255,255,0.24) 43%,",
            "rgba(255,255,255,0.10) 55%,",
            "rgba(0,0,0,0.22)  72%,",
            "rgba(0,0,0,0.68)  100%)",
          ].join(" "),
          pointerEvents: "none",
        }} />

        {/* Sweeping sheen */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.28) 50%, transparent 70%)",
          animation: "poleSheen 3.5s ease-in-out infinite",
          pointerEvents: "none",
        }} />
      </div>

      {/* Gold bottom rail */}
      <div style={{
        height: "4px",
        background: "linear-gradient(to right, #5a3e00, #b8860b, #f5c842, #ffe066, #f5c842, #b8860b, #5a3e00)",
        boxShadow: "0 -1px 6px rgba(245,200,66,0.45)",
      }} />
    </div>
  );
}
