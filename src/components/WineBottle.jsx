const BOTTLE_COLORS = {
  red: '#4a1525',
  white: '#8b7d3c',
  rose: '#d4789c',
  sparkling: '#c9b037',
  dessert: '#8b6914',
  fortified: '#5c3317',
  orange: '#cc7722',
};

export default function WineBottle({ type = 'red', size = 80, className = '' }) {
  const color = BOTTLE_COLORS[type] || BOTTLE_COLORS.red;
  const ratio = size / 80;

  return (
    <svg
      width={size}
      height={size * 2.5}
      viewBox="0 0 80 200"
      className={className}
      aria-label={`${type} wine bottle`}
    >
      {/* Capsule / foil */}
      <rect x="30" y="2" width="20" height="20" rx="3" fill={color} opacity="0.9" />
      {/* Neck */}
      <rect x="33" y="20" width="14" height="50" rx="2" fill={color} opacity="0.85" />
      {/* Shoulder curve */}
      <path
        d="M33 70 Q33 90 15 100 L15 180 Q15 195 30 195 L50 195 Q65 195 65 180 L65 100 Q47 90 47 70"
        fill={color}
      />
      {/* Label area */}
      <rect x="20" y="115" width="40" height="50" rx="3" fill="#f5f0e8" opacity="0.9" />
      <rect x="25" y="125" width="30" height="3" rx="1" fill={color} opacity="0.3" />
      <rect x="28" y="132" width="24" height="2" rx="1" fill={color} opacity="0.2" />
      <rect x="28" y="138" width="24" height="2" rx="1" fill={color} opacity="0.2" />
      <rect x="30" y="148" width="20" height="6" rx="1" fill={color} opacity="0.4" />
      {/* Shine */}
      <ellipse cx="28" cy="140" rx="4" ry="30" fill="white" opacity="0.08" />
    </svg>
  );
}
