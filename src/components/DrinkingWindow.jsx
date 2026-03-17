export default function DrinkingWindow({ drinkFrom, drinkTo, vintage }) {
  if (!drinkFrom && !drinkTo) return null;

  const currentYear = new Date().getFullYear();
  const from = drinkFrom || (vintage ? vintage + 1 : currentYear);
  const to = drinkTo || from + 10;
  const totalSpan = to - from;

  let status, statusColor, statusBg;
  if (currentYear < from) {
    status = 'Too Early';
    statusColor = 'text-blue-700';
    statusBg = 'bg-blue-50 border-blue-200';
  } else if (currentYear > to) {
    status = 'Past Window';
    statusColor = 'text-stone-500';
    statusBg = 'bg-stone-100 border-stone-200';
  } else {
    const progress = (currentYear - from) / totalSpan;
    if (progress < 0.3) {
      status = 'Approachable';
      statusColor = 'text-green-700';
      statusBg = 'bg-green-50 border-green-200';
    } else if (progress < 0.7) {
      status = 'Peak Drinking';
      statusColor = 'text-emerald-700';
      statusBg = 'bg-emerald-50 border-emerald-200';
    } else {
      status = 'Drink Soon';
      statusColor = 'text-amber-700';
      statusBg = 'bg-amber-50 border-amber-200';
    }
  }

  // Progress bar
  const rangeStart = Math.min(from, currentYear);
  const rangeEnd = Math.max(to, currentYear);
  const totalRange = rangeEnd - rangeStart || 1;
  const windowStart = ((from - rangeStart) / totalRange) * 100;
  const windowWidth = ((to - from) / totalRange) * 100;
  const nowPos = ((currentYear - rangeStart) / totalRange) * 100;

  return (
    <div className={`rounded-lg border p-3 ${statusBg}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-semibold ${statusColor}`}>{status}</span>
        <span className="text-xs text-stone-500">{from} — {to}</span>
      </div>
      <div className="relative h-3 bg-stone-200 rounded-full overflow-hidden">
        {/* Window range */}
        <div
          className="absolute h-full bg-green-400/60 rounded-full"
          style={{ left: `${windowStart}%`, width: `${windowWidth}%` }}
        />
        {/* Current year marker */}
        <div
          className="absolute top-0 h-full w-0.5 bg-stone-800"
          style={{ left: `${nowPos}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-stone-400">{rangeStart}</span>
        <span className="text-[10px] text-stone-600 font-medium">Now: {currentYear}</span>
        <span className="text-[10px] text-stone-400">{rangeEnd}</span>
      </div>
    </div>
  );
}
