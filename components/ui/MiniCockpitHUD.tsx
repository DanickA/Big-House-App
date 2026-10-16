import React from 'react';
import {
  Calendar,
  Sprout,
  Receipt,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Droplets,
  Users,
  Key,
  ShieldCheck,
} from 'lucide-react';

export type CockpitIconName =
  | 'calendar'
  | 'sprout'
  | 'receipt'
  | 'dollar'
  | 'alert'
  | 'check'
  | 'droplets'
  | 'users'
  | 'key'
  | 'shield';

const ICON_REGISTRY: Record<
  CockpitIconName,
  React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
> = {
  calendar: Calendar,
  sprout: Sprout,
  receipt: Receipt,
  dollar: DollarSign,
  alert: AlertCircle,
  check: CheckCircle2,
  droplets: Droplets,
  users: Users,
  key: Key,
  shield: ShieldCheck,
};

export interface CockpitMetric {
  label: string;
  value: string | number;
  icon:
    | CockpitIconName
    | React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  color?: 'mint' | 'terracotta' | 'brand-deep' | 'sand';
  highlight?: boolean;
}

interface MiniCockpitHUDProps {
  metrics: CockpitMetric[];
  className?: string;
}

const COLOR_MAP = {
  mint: {
    bg: 'bg-[#c7e1d7]/50 dark:bg-mint/15',
    text: 'text-mint',
    border: 'border-[#6eb5a5]/30',
  },
  terracotta: {
    bg: 'bg-[#ce9b8c]/25 dark:bg-terracotta/15',
    text: 'text-terracotta',
    border: 'border-[#aa4b50]/30',
  },
  'brand-deep': {
    bg: 'bg-[#ce9b8c]/20 dark:bg-brand-deep/15',
    text: 'text-brand-deep',
    border: 'border-[#bd7471]/30',
  },
  sand: {
    bg: 'bg-[#e7d6ac]/40 dark:bg-tertiary',
    text: 'text-label-primary',
    border: 'border-[#e7d6ac]/60',
  },
};

export default function MiniCockpitHUD({ metrics, className = '' }: MiniCockpitHUDProps) {
  return (
    <div
      role="region"
      aria-label="Panel de micro-métricas HUD"
      className={`glass-card p-2 sm:p-2.5 rounded-2xl border border-separator/80 shadow-2xs flex items-center gap-2 overflow-x-auto no-scrollbar ${className}`}
    >
      {metrics.map((metric, idx) => {
        const IconComponent =
          typeof metric.icon === 'string'
            ? ICON_REGISTRY[metric.icon] || CheckCircle2
            : metric.icon;

        const colorStyle = COLOR_MAP[metric.color || 'sand'];

        return (
          <div
            key={idx}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition shrink-0 ${
              metric.highlight
                ? `${colorStyle.bg} ${colorStyle.border} border shadow-2xs`
                : 'bg-white/50 dark:bg-tertiary/40 border border-separator/40'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-lg ${colorStyle.bg} ${colorStyle.text} flex items-center justify-center shrink-0`}
            >
              <IconComponent size={13} strokeWidth={2.2} />
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="apple-footnote font-bold text-label-primary tabular-nums">
                {metric.value}
              </span>
              <span className="apple-caption-2 text-label-secondary font-medium whitespace-nowrap">
                {metric.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
