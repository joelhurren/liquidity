import { WINE_TYPES } from '../data/wineData';

const TYPE_COLORS = {
  red: 'bg-red-800',
  white: 'bg-amber-100 border border-amber-300',
  rose: 'bg-pink-300',
  sparkling: 'bg-yellow-100 border border-yellow-300',
  dessert: 'bg-amber-500',
  fortified: 'bg-amber-800',
  orange: 'bg-orange-400',
};

export default function WineTypeIcon({ type, size = 'md' }) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  };

  return (
    <span
      className={`inline-block rounded-full ${TYPE_COLORS[type] || 'bg-stone-400'} ${sizeClasses[size]}`}
      title={WINE_TYPES.find(t => t.value === type)?.label || type}
    />
  );
}
