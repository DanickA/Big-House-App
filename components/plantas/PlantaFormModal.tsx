'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Planta } from './PlantaCard';
import { createPlanta, updatePlanta } from '@/actions/plantas';
import { compressImage } from '@/lib/image-compression';
import { X, Check, Sprout, MapPin, Tag, Droplets, Camera, Minus, Plus, RefreshCw, Loader2 } from 'lucide-react';
import WaterProgressRing from '@/components/ui/WaterProgressRing';

interface PlantaFormModalProps {
  isOpen: boolean;
  plantaAEditar: Planta | null;
  onClose: () => void;
  onSuccess: (mensaje: string) => void;
}

const UBICACIONES_SUGERIDAS = ['Balcón', 'Sala', 'Comedor', 'Habitación', 'Jardín', 'Terraza'];
const FRECUENCIAS_PREDEFINIDAS = [
  { dias: 3, label: '3 días' },
  { dias: 7, label: '7 días (Semanal)' },
  { dias: 15, label: '15 días' },
  { dias: 30, label: '30 días' },
];

export default function PlantaFormModal({
  isOpen,
  plantaAEditar,
  onClose,
  onSuccess,
}: PlantaFormModalProps) {
  const [mounted, setMounted] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estados interactivos
  const [nombre, setNombre] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [especie, setEspecie] = useState('');
  const [frecuenciaDias, setFrecuenciaDias] = useState<number>(7);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cargar datos iniciales al abrir
  useEffect(() => {
    if (plantaAEditar) {
      setNombre(plantaAEditar.nombre_comun || '');
      setUbicacion(plantaAEditar.ubicacion || '');
      setEspecie(plantaAEditar.especie || '');
      setFrecuenciaDias(plantaAEditar.frecuencia_dias ?? 7);
      setFotoPreview(plantaAEditar.foto_url || null);
    } else {
      setNombre('');
      setUbicacion('');
      setEspecie('');
      setFrecuenciaDias(7);
      setFotoPreview(null);
    }
    setErrorMsg(null);
  }, [plantaAEditar, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFotoPreview(url);
    }
  }

  function handleTriggerFileInput() {
    fileInputRef.current?.click();
  }

  function handleIncrementarFrecuencia() {
    setFrecuenciaDias((prev) => Math.min(60, prev + 1));
  }

  function handleDecrementarFrecuencia() {
    setFrecuenciaDias((prev) => Math.max(1, prev - 1));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setProcesando(true);

    try {
      const formData = new FormData(e.currentTarget);
      formData.set('frecuencia_riego', frecuenciaDias.toString());

      // Optimizar y comprimir la foto en el cliente si existe (evita errores 413 de 1MB/4.5MB)
      const rawFoto = formData.get('foto') as File | null;
      if (rawFoto && rawFoto.size > 0) {
        const fotoOptimizada = await compressImage(rawFoto);
        formData.set('foto', fotoOptimizada);
      }

      const res = plantaAEditar
        ? await updatePlanta(plantaAEditar.id, formData)
        : await createPlanta(formData);

      if (res.success) {
        onSuccess(plantaAEditar ? '¡Planta actualizada con éxito!' : '¡Planta registrada con éxito!');
        onClose();
      } else {
        setErrorMsg(res.error || 'Ocurrió un error al guardar');
      }
    } catch (err: any) {
      console.error('Error al enviar formulario de planta:', err);
      setErrorMsg(
        err?.message || 'Error de conexión al guardar los datos. Intenta nuevamente.'
      );
    } finally {
      setProcesando(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Fondo oscuro para cerrar */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      {/* Contenedor del Modal con curvatura uniforme y flex vertical */}
      <div className="relative glass-modal w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col my-auto max-h-[calc(100vh-3.5rem)] border border-white/80 dark:border-white/10 animate-fade-in-up">
        
        {/* Cabecera Fija con Esquinas Superiores Redondeadas Naturales */}
        <div className="flex justify-between items-center px-6 sm:px-8 py-5 border-b border-separator bg-secondary/85 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-mint/15 border border-mint/30 text-mint flex items-center justify-center shadow-2xs">
              <Sprout size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="apple-title-3 font-semibold text-label-primary tracking-tight">
                {plantaAEditar ? 'Editar Planta' : 'Nueva Planta'}
              </h2>
              <p className="apple-subhead text-label-secondary font-normal">
                {plantaAEditar ? 'Actualiza los datos y frecuencia de riego' : 'Registra un nuevo espécimen en el hogar'}
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="w-9 h-9 rounded-full bg-tertiary text-label-secondary hover:text-label-primary hover:bg-tertiary-hover transition flex items-center justify-center cursor-pointer border border-separator active:scale-90"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Cuerpo del Formulario Desplazable con Scrollbar Fina Integrada */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-5 flex-1 pr-5 sm:pr-7">
          
          {errorMsg && (
            <div className="p-3.5 bg-terracotta/15 border border-terracotta/30 text-terracotta rounded-2xl text-xs font-semibold text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* 1. SELECCIÓN VISUAL DE FOTOGRAFÍA */}
            <div>
              <label className="block apple-subhead font-medium text-label-primary mb-1.5">
                Fotografía de la planta (opcional)
              </label>

              <input
                ref={fileInputRef}
                type="file"
                name="foto"
                accept="image/*"
                onChange={handleFotoChange}
                className="hidden"
              />

              <div
                onClick={handleTriggerFileInput}
                className="relative h-44 rounded-3xl border-2 border-dashed border-separator bg-secondary/40 dark:bg-tertiary/40 hover:bg-secondary/70 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden group shadow-2xs"
              >
                {fotoPreview ? (
                  <>
                    <img
                      src={fotoPreview}
                      alt="Previsualización"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-4 py-2 bg-secondary backdrop-blur-md rounded-2xl text-xs font-semibold text-label-primary flex items-center gap-1.5 shadow-md">
                        <RefreshCw size={13} />
                        <span>Cambiar fotografía</span>
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4 space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-mint/15 border border-mint/30 text-mint flex items-center justify-center mx-auto group-hover:scale-110 transition shadow-2xs">
                      <Camera size={22} strokeWidth={2} />
                    </div>
                    <div>
                      <p className="apple-caption-1 font-semibold text-label-primary">
                        Toca para subir o tomar una foto
                      </p>
                      <p className="apple-caption-2 text-label-secondary font-normal">
                        Formatos JPG, PNG o captura desde tu móvil
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. NOMBRE O APODO */}
            <div>
              <label className="block apple-subhead font-medium text-label-primary mb-1.5">
                Nombre o apodo *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mint">
                  <Sprout size={16} strokeWidth={2.2} />
                </div>
                <input
                  type="text"
                  name="nombre_comun"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Monstera de la sala"
                  className="w-full pl-10 pr-10 py-3 bg-secondary/80 dark:bg-tertiary/60 border border-separator rounded-2xl text-sm text-label-primary font-medium placeholder:text-label-tertiary focus:outline-none focus:bg-secondary focus:border-mint focus:ring-3 focus:ring-mint/15 transition shadow-2xs"
                />
                {nombre && (
                  <button
                    type="button"
                    onClick={() => setNombre('')}
                    aria-label="Limpiar nombre"
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-label-tertiary hover:text-label-primary transition"
                  >
                    <X size={14} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>

            {/* 3. UBICACIÓN CON CHIPS RÁPIDOS */}
            <div>
              <label className="block apple-subhead font-medium text-label-primary mb-1.5">
                Ubicación en casa *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mint">
                  <MapPin size={16} strokeWidth={2.2} />
                </div>
                <input
                  type="text"
                  name="ubicacion"
                  required
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  placeholder="Ej. Balcón, Sala"
                  className="w-full pl-10 pr-4 py-3 bg-secondary/80 dark:bg-tertiary/60 border border-separator rounded-2xl text-sm text-label-primary font-medium placeholder:text-label-tertiary focus:outline-none focus:bg-secondary focus:border-mint focus:ring-3 focus:ring-mint/15 transition shadow-2xs"
                />
              </div>

              {/* Sugerencias Rápidas */}
              <div className="flex items-center gap-1.5 flex-wrap pt-2">
                <span className="apple-caption-2 font-medium text-label-secondary mr-1">
                  Sugerencias:
                </span>
                {UBICACIONES_SUGERIDAS.map((lugar) => (
                  <button
                    key={lugar}
                    type="button"
                    onClick={() => setUbicacion(lugar)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition cursor-pointer active:scale-95 ${
                      ubicacion === lugar
                        ? 'bg-mint text-white shadow-2xs'
                        : 'bg-tertiary hover:bg-tertiary-hover text-label-secondary border border-separator'
                    }`}
                  >
                    {lugar}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. ESPECIE (OPCIONAL) */}
            <div>
              <label className="block apple-subhead font-medium text-label-primary mb-1.5">
                Especie botánica (opcional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-label-secondary">
                  <Tag size={15} strokeWidth={2.2} />
                </div>
                <input
                  type="text"
                  name="especie"
                  value={especie}
                  onChange={(e) => setEspecie(e.target.value)}
                  placeholder="Ej. Monstera deliciosa"
                  className="w-full pl-10 pr-4 py-3 bg-secondary/80 dark:bg-tertiary/60 border border-separator rounded-2xl text-sm text-label-primary font-medium placeholder:text-label-tertiary focus:outline-none focus:bg-secondary focus:border-mint focus:ring-3 focus:ring-mint/15 transition shadow-2xs italic"
                />
              </div>
            </div>

            {/* 5. FRECUENCIA DE RIEGO INTERACTIVA CON STEPPER Y PREVIEW */}
            <div className="p-4.5 bg-secondary/75 dark:bg-tertiary/40 rounded-3xl border border-separator space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block apple-subhead font-medium text-label-primary flex items-center gap-1.5">
                    <Droplets size={14} className="text-mint" />
                    <span>Frecuencia de riego</span>
                  </label>
                  <p className="apple-caption-2 text-label-secondary font-normal mt-0.5">
                    Define cada cuántos días necesita agua esta planta
                  </p>
                </div>

                {/* Mini Anillo de Previsualización en Vivo */}
                <div className="flex items-center gap-2 bg-mint/15 dark:bg-secondary px-3 py-1.5 rounded-2xl border border-mint/30 dark:border-separator shadow-2xs">
                  <span className="apple-caption-2 font-semibold text-label-primary">Previsualización:</span>
                  <WaterProgressRing
                    diasRestantes={frecuenciaDias}
                    frecuenciaDias={frecuenciaDias}
                    size={36}
                    strokeWidth={3}
                    darkText={true}
                  />
                </div>
              </div>

              {/* Stepper Táctil Apple HIG */}
              <div className="flex items-center justify-between gap-3 bg-secondary dark:bg-secondary p-2 rounded-2xl border border-separator">
                <button
                  type="button"
                  onClick={handleDecrementarFrecuencia}
                  aria-label="Disminuir frecuencia de riego"
                  className="touch-target w-10 h-10 rounded-xl bg-tertiary hover:bg-tertiary-hover text-label-primary flex items-center justify-center transition cursor-pointer active:scale-90"
                >
                  <Minus size={16} strokeWidth={2.5} />
                </button>

                <div className="text-center">
                  <span className="apple-title-3 font-bold text-label-primary tabular-nums">
                    Cada {frecuenciaDias} {frecuenciaDias === 1 ? 'día' : 'días'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleIncrementarFrecuencia}
                  aria-label="Aumentar frecuencia de riego"
                  className="touch-target w-10 h-10 rounded-xl bg-tertiary hover:bg-tertiary-hover text-label-primary flex items-center justify-center transition cursor-pointer active:scale-90"
                >
                  <Plus size={16} strokeWidth={2.5} />
                </button>
              </div>

              {/* Píldoras Rápidas Predefinidas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {FRECUENCIAS_PREDEFINIDAS.map((item) => (
                  <button
                    key={item.dias}
                    type="button"
                    onClick={() => setFrecuenciaDias(item.dias)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition text-center cursor-pointer active:scale-95 ${
                      frecuenciaDias === item.dias
                        ? 'bg-mint text-white shadow-2xs'
                        : 'bg-tertiary hover:bg-tertiary-hover text-label-secondary border border-separator'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* BOTONES SIMÉTRICOS (APPLE HIG) */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={procesando}
                className="flex-1 btn-apple-gray text-sm font-semibold justify-center"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={procesando}
                className="flex-1 btn-apple-filled-mint text-sm font-semibold justify-center gap-2"
              >
                {procesando ? (
                  <>
                    <Loader2 size={16} className="animate-spin shrink-0" />
                    <span>Guardando planta...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} strokeWidth={2.4} className="shrink-0" />
                    <span>
                      {plantaAEditar ? 'Guardar cambios' : 'Registrar planta'}
                    </span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>,
    document.body
  );
}