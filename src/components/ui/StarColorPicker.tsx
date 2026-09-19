import type { StarColor, STAR_COLORS } from '@/types';

const starColorsData = [
  { value: 'blue' as StarColor, label: 'Azul', glow: '#60a5fa', hex: '#60a5fa' },
  { value: 'white' as StarColor, label: 'Blanco', glow: '#f1f5f9', hex: '#f1f5f9' },
  { value: 'yellow' as StarColor, label: 'Amarillo', glow: '#fbbf24', hex: '#fbbf24' },
  { value: 'orange' as StarColor, label: 'Naranja', glow: '#fb923c', hex: '#fb923c' },
  { value: 'red' as StarColor, label: 'Rojo', glow: '#f87171', hex: '#f87171' },
];

interface StarColorPickerProps {
  value: StarColor;
  onChange: (color: StarColor) => void;
}

export function StarColorPicker({ value, onChange }: StarColorPickerProps) {
  return (
    <div className="flex gap-3 justify-center">
      {starColorsData.map(color => (
        <button
          key={color.value}
          type="button"
          onClick={() => onChange(color.value)}
          className={`relative w-12 h-12 rounded-full transition-all duration-200 ${
            value === color.value ? 'scale-110 ring-2 ring-white/40' : 'scale-100 hover:scale-105'
          }`}
          aria-label={color.label}
          title={color.label}
        >
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={color.hex}
              opacity={value === color.value ? 1 : 0.6}
            />
          </svg>
          {value === color.value && (
            <div
              className="absolute inset-0 rounded-full blur-md -z-10"
              style={{ backgroundColor: color.glow, opacity: 0.4 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}