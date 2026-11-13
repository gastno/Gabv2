import "./ParallaxStars.css";

function createShadows(count, seed) {
  let state = seed;
  const next = () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };

  return Array.from({ length: count }, () =>
    `${(next() * 100).toFixed(3)}vw ${(next() * 100).toFixed(3)}vh #f2f3ee`
  ).join(", ");
}

const layers = [
  { size: "small", shadows: createShadows(700, 17), duration: 50 },
  { size: "medium", shadows: createShadows(200, 31), duration: 100 },
  { size: "large", shadows: createShadows(100, 47), duration: 150 },
];

function ParallaxStars({ speed = 1 }) {
  if (!Number.isFinite(speed) || speed <= 0) {
    throw new RangeError("ParallaxStars speed must be a positive finite number");
  }

  return (
    <div className="parallax-stars" aria-hidden="true">
      {layers.map(({ size, shadows, duration }) => (
        <div
          key={size}
          className={`parallax-stars-layer parallax-stars-layer--${size}`}
          style={{ boxShadow: shadows, animationDuration: `${duration / speed}s` }}
        />
      ))}
    </div>
  );
}

export default ParallaxStars;
