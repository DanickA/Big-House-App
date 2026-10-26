'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Smartphone,
  Wifi,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  Sparkles,
  QrCode,
} from 'lucide-react';

interface MobileTestingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileTestingModal({
  isOpen,
  onClose,
}: MobileTestingModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'wifi' | 'tunnel'>('wifi');
  const [targetPath, setTargetPath] = useState<'/prototype/apple-design' | '/'>('/prototype/apple-design');
  const [networkInfo, setNetworkInfo] = useState<{
    ip: string;
    port: string;
    prototypeUrl: string;
    appUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const setFallbackNetworkInfo = () => {
      const host = typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : '127.0.0.1';
      setNetworkInfo({
        ip: host,
        port: '3000',
        prototypeUrl: `http://${host}:3000/prototype/apple-design`,
        appUrl: `http://${host}:3000/`,
      });
    };

    if (typeof fetch === 'function') {
      fetch('/api/network-ip')
        .then((res) => res.json())
        .then((data) => {
          if (data.ip) {
            setNetworkInfo(data);
          } else {
            setFallbackNetworkInfo();
          }
        })
        .catch(() => {
          setFallbackNetworkInfo();
        });
    } else {
      setFallbackNetworkInfo();
    }
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const currentUrl = networkInfo
    ? targetPath === '/prototype/apple-design'
      ? networkInfo.prototypeUrl
      : networkInfo.appUrl
    : 'http://localhost:3000/prototype/apple-design';

  const qrImageUrl = `/api/qr?url=${encodeURIComponent(currentUrl)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleClose = () => {
    onClose();
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-modal-title"
      className="fixed inset-0 z-[100000] bg-black/65 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in select-none"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-modal w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-separator max-h-[92vh] flex flex-col"
      >
        {/* Cabecera Apple HIG */}
        <div className="px-5 py-4 border-b border-separator flex items-center justify-between gap-3 bg-secondary/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-terracotta text-white flex items-center justify-center shadow-xs">
              <Smartphone size={18} />
            </div>
            <div>
              <h2 id="mobile-modal-title" className="text-sm font-bold text-label-primary">
                Probar en tu Celular (iOS / Android)
              </h2>
              <p className="text-[11px] text-label-tertiary">
                Prueba de campo con gestos físicos y hápticos reales antes de producción
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar ventana de prueba móvil"
            className="touch-target w-8 h-8 rounded-full bg-tertiary border border-separator flex items-center justify-center text-label-secondary hover:text-label-primary cursor-pointer active:scale-95 transition-transform"
          >
            <X size={15} />
          </button>
        </div>

        {/* Selector de Pestaña (Wi-Fi Local vs Túnel HTTPS) */}
        <div className="px-5 pt-4 pb-2">
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-tertiary border border-separator text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('wifi')}
              className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'wifi'
                  ? 'bg-secondary text-label-primary shadow-sm border border-separator'
                  : 'text-label-tertiary hover:text-label-primary'
              }`}
            >
              <Wifi size={14} className={activeTab === 'wifi' ? 'text-mint' : ''} />
              <span>Red Wi-Fi Local</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tunnel')}
              className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'tunnel'
                  ? 'bg-secondary text-label-primary shadow-sm border border-separator'
                  : 'text-label-tertiary hover:text-label-primary'
              }`}
            >
              <ShieldCheck size={14} className={activeTab === 'tunnel' ? 'text-brand-deep' : ''} />
              <span>Túnel HTTPS Seguro</span>
            </button>
          </div>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs select-text">
          {activeTab === 'wifi' ? (
            <div className="space-y-4">
              {/* Selector de destino */}
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-tertiary/70 border border-separator">
                <span className="text-[11px] font-bold text-label-secondary">Destino del QR:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTargetPath('/prototype/apple-design')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                      targetPath === '/prototype/apple-design'
                        ? 'bg-terracotta text-white shadow-xs'
                        : 'bg-secondary text-label-tertiary hover:text-label-primary'
                    }`}
                  >
                    Prototipo Apple
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetPath('/')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                      targetPath === '/'
                        ? 'bg-terracotta text-white shadow-xs'
                        : 'bg-secondary text-label-tertiary hover:text-label-primary'
                    }`}
                  >
                    Lobby Principal
                  </button>
                </div>
              </div>

              {/* QR Code interactivo */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-3xl bg-secondary border border-separator">
                <div className="w-44 h-44 rounded-2xl bg-white p-3 shadow-md flex items-center justify-center shrink-0 border border-separator/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrImageUrl}
                    alt="Código QR para escanear en celular"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="space-y-3 flex-1 text-left">
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-mint/15 text-mint border border-mint/25">
                      Wi-Fi Listo
                    </span>
                    <h3 className="apple-subhead font-bold text-label-primary">
                      Escanea con tu cámara
                    </h3>
                    <p className="text-[11px] text-label-secondary leading-relaxed">
                      Apunta la cámara de tu iPhone o Android a este código. Se abrirá Safari o Chrome directamente sin cables.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-label-tertiary uppercase tracking-wider block">
                      Enlace directo de red:
                    </label>
                    <div className="flex items-center gap-1.5 p-1.5 pl-3 rounded-xl bg-tertiary border border-separator">
                      <span className="text-[11px] font-mono text-label-primary truncate flex-1 select-all">
                        {currentUrl}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="touch-target px-2.5 py-1 rounded-lg bg-secondary text-label-primary hover:bg-tertiary-hover border border-separator/80 font-bold text-[11px] flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                      >
                        {copied ? (
                          <>
                            <Check size={12} className="text-mint" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instrucciones y tips */}
              <div className="p-3.5 rounded-2xl bg-tertiary/60 border border-separator space-y-2">
                <p className="font-bold text-label-primary flex items-center gap-1.5">
                  <Sparkles size={13} className="text-mint" />
                  <span>Pasos para la prueba:</span>
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-[11px] text-label-secondary">
                  <li>Tu celular y tu computadora deben estar en la <strong>misma red Wi-Fi</strong>.</li>
                  <li>Si el servidor de desarrollo aún no acepta conexiones externas, puedes ejecutar en tu terminal:</li>
                </ol>
                <div className="p-2 rounded-xl bg-black/80 text-emerald-400 font-mono text-[11px] flex items-center justify-between">
                  <span>npm run dev:mobile</span>
                  <Terminal size={13} className="text-emerald-400/70" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-3xl bg-secondary border border-separator space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-mint" />
                  <h3 className="apple-subhead font-bold text-label-primary">
                    Túnel Seguro HTTPS con Cloudflare
                  </h3>
                </div>
                <p className="text-[11px] text-label-secondary leading-relaxed">
                  Para probar en Safari iOS características nativas de producción como la <strong>Instalación como App Independiente (PWA Standalone)</strong> o acceso a cámara para escaneo de códigos con certificados TLS válidos, iOS exige conexión HTTPS segura.
                </p>

                <div className="p-3 rounded-2xl bg-tertiary/80 border border-separator space-y-2">
                  <p className="text-[11px] font-bold text-label-primary">
                    Comando de un solo paso:
                  </p>
                  <div className="p-2.5 rounded-xl bg-black/80 text-emerald-400 font-mono text-xs flex items-center justify-between">
                    <span>npm run dev:tunnel</span>
                    <Terminal size={14} className="text-emerald-400/70" />
                  </div>
                  <p className="text-[10px] text-label-tertiary">
                    Inicia automáticamente un túnel HTTPS temporal y muestra el QR en la terminal. Cero configuración de firewall o router.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pie de modal */}
        <div className="p-4 border-t border-separator bg-tertiary/40 flex justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="touch-target px-5 py-2 rounded-xl bg-secondary border border-separator text-label-primary font-bold text-xs hover:bg-tertiary active:scale-97 cursor-pointer transition-transform"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
