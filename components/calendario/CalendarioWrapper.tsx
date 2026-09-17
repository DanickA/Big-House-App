'use client';

import React, { useState } from 'react';
import { VistaMensual, EventoUI } from './VistaMensual';
import { AgendaDia } from './AgendaDia';
import { FormularioEvento } from './FormularioEvento';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { addMonths, subMonths, format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface CalendarioWrapperProps {
  eventosIniciales: EventoUI[];
  usuarios: { id: string; nombre: string }[];
  usuarioActualId: string;
}

export function CalendarioWrapper({ eventosIniciales, usuarios, usuarioActualId }: CalendarioWrapperProps) {
  const router = useRouter();
  const [mesActual, setMesActual] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(null);
  const [fechaPreseleccionada, setFechaPreseleccionada] = useState<Date | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);

  const irMesAnterior = () => setMesActual(subMonths(mesActual, 1));
  const irMesSiguiente = () => setMesActual(addMonths(mesActual, 1));
  const irHoy = () => setMesActual(new Date());

  const handleEventModified = () => {
    router.refresh();
  };

  const abrirFormulario = (fecha?: Date) => {
    setFechaPreseleccionada(fecha || new Date());
    setShowForm(true);
  };

  const mesTitulo = format(mesActual, 'MMMM yyyy', { locale: es });

  return (
    <div className="flex flex-col h-full bg-system p-3 sm:p-4">
      {/* Controles de Navegación (RF-01) */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="apple-title-2 font-bold text-label-primary capitalize tracking-tight">{mesTitulo}</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={irHoy} 
            className="px-3 py-1.5 text-xs font-semibold border border-separator rounded-xl hover:bg-tertiary bg-secondary text-label-secondary shadow-2xs transition"
          >
            Hoy
          </button>
          <div className="flex border border-separator rounded-xl bg-secondary shadow-2xs overflow-hidden">
            <button onClick={irMesAnterior} className="p-1.5 hover:bg-tertiary border-r border-separator text-label-secondary transition">
              <ChevronLeft size={18}/>
            </button>
            <button onClick={irMesSiguiente} className="p-1.5 hover:bg-tertiary text-label-secondary transition">
              <ChevronRight size={18}/>
            </button>
          </div>
        </div>
      </div>

      {/* Vista Mensual (RF-01) */}
      <div className="flex-1 min-h-0 relative">
        <VistaMensual 
          mesActual={mesActual} 
          eventos={eventosIniciales} 
          onDiaSeleccionado={(dia) => setDiaSeleccionado(dia)} 
        />
        
        {/* Botón de acción en la esquina inferior izquierda (RF-01) */}
        <button 
          onClick={() => abrirFormulario(diaSeleccionado || new Date())}
          title="Agregar actividad"
          className="absolute bottom-5 left-5 w-13 h-13 bg-terracotta hover:bg-terracotta-hover text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all active:scale-95 z-20"
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      </div>

      {/* Drawer: Agenda del Día (RF-04) */}
      <AgendaDia 
        isOpen={diaSeleccionado !== null}
        onClose={() => setDiaSeleccionado(null)}
        fecha={diaSeleccionado || new Date()}
        eventos={diaSeleccionado ? eventosIniciales.filter(e => {
          const inicio = new Date(e.fecha_inicio);
          const fin = new Date(e.fecha_fin);
          inicio.setHours(0,0,0,0);
          fin.setHours(23,59,59,999);
          return diaSeleccionado >= inicio && diaSeleccionado <= fin;
        }) : []}
        onEventModified={handleEventModified}
        onCrearEnFecha={(f) => abrirFormulario(f)}
      />

      {/* Drawer: Formulario de Evento (RF-02) */}
      <FormularioEvento 
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        usuarios={usuarios}
        usuarioActualId={usuarioActualId}
        onEventCreated={handleEventModified}
        fechaPreseleccionada={fechaPreseleccionada}
      />
    </div>
  );
}
