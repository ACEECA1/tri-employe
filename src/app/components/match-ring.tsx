interface MatchRingProps {
  score: number;
  size?: number;
}

export function MatchRing({ score, size = 56 }: MatchRingProps) {
  const clamped = Math.max(0, Math.min(score, 10));
  const color = clamped >= 8 ? "#16a34a" : clamped >= 5 ? "#f59e0b" : "#dc2626";
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 10) * circumference;
  const rounded = Math.round(clamped * 10) / 10;
  const label = Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center" style={{ color, fontWeight: 600, fontSize: size * 0.23 }}>
        {label}/10
      </span>
    </div>
  );
}
