'use client';

interface WaterProgressRingProps {
  diasRestantes?: number | null;
  frecuenciaDias?: number | null;
  size?: number;
  strokeWidth?: number;
  darkText?: boolean;
}

export default function WaterProgressRing({
  diasRestantes,
  frecuenciaDias = 7,
  size = 46,
  strokeWidth = 3.5,
  darkText = false,
}: WaterProgressRingProps) {
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  // Cálculo del porcentaje de avance hacia el próximo riego
  let progress = 0;
  let strokeColor = '#5F6F52';
  let trackColor = darkText ? 'rgba(95, 111, 82, 0.15)' : 'rgba(255, 255, 255, 0.2)';
  let label = '-';
  let isLate = false;
  let isToday = false;

  if (diasRestantes === undefined || diasRestantes === null) {
    progress = 0;
    label = 'N/P';
    strokeColor = '#A39E95';
  } else if (diasRestantes < 0) {
    progress = 100;
    label = `${diasRestantes}d`;
    strokeColor = '#B84626';
    trackColor = darkText ? 'rgba(184, 70, 38, 0.15)' : 'rgba(184, 70, 38, 0.2)';
    isLate = true;
  } else if (diasRestantes === 0) {
    progress = 100;
    label = 'Hoy';
    strokeColor = '#C86242';
    trackColor = darkText ? 'rgba(200, 98, 66, 0.15)' : 'rgba(200, 98, 66, 0.2)';
    isToday = true;
  } else {
    const freq = frecuenciaDias && frecuenciaDias > 0 ? frecuenciaDias : 7;
    const diasTranscurridos = Math.max(0, freq - diasRestantes);
    progress = Math.min(100, Math.max(5, (diasTranscurridos / freq) * 100));
    label = `${diasRestantes}d`;

    if (diasRestantes === 1) {
      strokeColor = '#D97706';
    } else {
      strokeColor = '#5F6F52';
    }
  }

  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const textColor = darkText
    ? (isLate ? '#B84626' : isToday ? '#C86242' : '#2D3E24')
    : (diasRestantes === null ? '#736F68' : '#FFFFFF');

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full backdrop-blur-md ${
        isLate || isToday ? 'animate-pulse' : ''
      }`}
      style={{
        width: size,
        height: size,
        background: darkText ? 'rgba(238, 242, 234, 0.85)' : 'rgba(255, 255, 255, 0.35)',
        border: darkText ? '1px solid rgba(183, 203, 169, 0.6)' : 'none',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      }}
      title={
        diasRestantes === 0
          ? 'Riego requerido hoy'
          : diasRestantes !== null && diasRestantes !== undefined && diasRestantes < 0
          ? `Riego atrasado por ${Math.abs(diasRestantes)} días`
          : `Próximo riego en ${diasRestantes} días`
      }
    >
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Track de fondo */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Anillo de progreso animado */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          style={{
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.3s ease',
          }}
        />
      </svg>

      {/* Texto Central */}
      <span
        className="absolute text-[11px] font-extrabold tracking-tight"
        style={{
          color: textColor,
          textShadow: darkText ? 'none' : '0 1px 2px rgba(0,0,0,0.4)',
        }}
      >
        {label}
      </span>
    </div>
  );
}
