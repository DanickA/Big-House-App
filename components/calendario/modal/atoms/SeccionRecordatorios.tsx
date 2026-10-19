'use client';

import { Bell, Smartphone, Mail } from 'lucide-react';
import AppleSwitch from '@/components/ui/AppleSwitch';

interface SeccionRecordatoriosProps {
  activarAlarma: boolean;
  onToggleAlarma: (val: boolean) => void;
  canalPush: boolean;
  onTogglePush: (val: boolean) => void;
  canalEmail: boolean;
  onToggleEmail: (val: boolean) => void;
  minutosAnticipacion: number;
  onChangeMinutosAnticipacion: (min: number) => void;
}

export default function SeccionRecordatorios({
  activarAlarma,
  onToggleAlarma,
  canalPush,
  onTogglePush,
  canalEmail,
  onToggleEmail,
  minutosAnticipacion,
  onChangeMinutosAnticipacion,
}: SeccionRecordatoriosProps) {
  return (
    <div className="p-4 bg-tertiary rounded-2xl border border-separator/80 dark:border-separator space-y-3">
      <div className="flex items-center justify-between">
        <span className="apple-footnote font-semibold text-label-primary flex items-center gap-1.5">
          <Bell size={13} className="text-terracotta" />
          <span>Recordatorios y Alarma</span>
        </span>
        <AppleSwitch
          checked={activarAlarma}
          onChange={(checked) => onToggleAlarma(checked)}
        />
      </div>

      {activarAlarma && (
        <div className="space-y-3 pt-2 border-t border-separator/40 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <span className="apple-caption-1 text-label-secondary font-medium">Anticipación:</span>
            <select
              value={minutosAnticipacion}
              onChange={(e) => onChangeMinutosAnticipacion(parseInt(e.target.value, 10))}
              className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-secondary border border-separator/80 text-label-primary focus:outline-none cursor-pointer"
            >
              <option value={15}>15 minutos antes</option>
              <option value={30}>30 minutos antes</option>
              <option value={60}>1 hora antes</option>
              <option value={120}>2 horas antes</option>
              <option value={1440}>1 día antes</option>
              <option value={2880}>2 días antes</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-label-secondary select-none">
              <input
                type="checkbox"
                checked={canalPush}
                onChange={(e) => onTogglePush(e.target.checked)}
                className="rounded accent-terracotta cursor-pointer"
              />
              <Smartphone size={13} className="text-label-tertiary" />
              <span>Notificación Push</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-label-secondary select-none">
              <input
                type="checkbox"
                checked={canalEmail}
                onChange={(e) => onToggleEmail(e.target.checked)}
                className="rounded accent-terracotta cursor-pointer"
              />
              <Mail size={13} className="text-label-tertiary" />
              <span>Correo electrónico</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
