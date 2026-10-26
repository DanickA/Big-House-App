'use client';

import React, { useState } from 'react';
import PrototypeHeader, {
  PrototypeMode,
  ViewportMode,
} from '@/components/prototype/apple-design/PrototypeHeader';
import ActualModeView from '@/components/prototype/apple-design/ActualModeView';
import AppleCraftModeView from '@/components/prototype/apple-design/AppleCraftModeView';
import BreakUiToolbar from '@/components/prototype/apple-design/BreakUiToolbar';
import AuditComparisonModal from '@/components/prototype/apple-design/AuditComparisonModal';
import MobileTestingModal from '@/components/prototype/apple-design/MobileTestingModal';
import IPhoneFrame from '@/components/prototype/apple-design/IPhoneFrame';
import {
  BreakUiMode,
  DEMO_MEMBERS,
  WORST_CASE_MEMBERS,
  SINGLE_MEMBER,
  EMPTY_MEMBERS,
} from './fixtures';

export interface AppleDesignPrototypeProps {
  initialMode?: PrototypeMode;
  initialViewport?: ViewportMode;
  initialBreakMode?: BreakUiMode;
}

export default function AppleDesignPrototype({
  initialMode = 'apple-craft',
  initialViewport = 'fullscreen',
  initialBreakMode = 'demo',
}: AppleDesignPrototypeProps) {
  const [prototypeMode, setPrototypeMode] = useState<PrototypeMode>(initialMode);
  const [viewportMode, setViewportMode] = useState<ViewportMode>(initialViewport);
  const [breakMode, setBreakMode] = useState<BreakUiMode>(initialBreakMode);

  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isMobileTestingOpen, setIsMobileTestingOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Mapeo reactivo del dataset de habitantes según Break-UI
  const currentMembers = (() => {
    switch (breakMode) {
      case 'worst':
        return WORST_CASE_MEMBERS;
      case 'single':
        return SINGLE_MEMBER;
      case 'empty':
        return EMPTY_MEMBERS;
      case 'demo':
      default:
        return DEMO_MEMBERS;
    }
  })();

  const isAnyModalOpen = isSheetOpen || isAuditModalOpen || isMobileTestingOpen;

  const activeModuleContent =
    prototypeMode === 'actual' ? (
      <ActualModeView
        members={currentMembers}
        breakMode={breakMode}
        onSheetOpenChange={setIsSheetOpen}
      />
    ) : (
      <AppleCraftModeView
        members={currentMembers}
        breakMode={breakMode}
        onSheetOpenChange={setIsSheetOpen}
      />
    );

  return (
    <div className="relative min-h-screen bg-system text-label-primary p-3 sm:p-8 transition-colors duration-300 pb-28">
      {/* Resplandores ambientales iOS Liquid Glass */}
      <div className="ambient-glow-mint top-[-60px] left-[-30px]" />
      <div className="ambient-glow-terracotta bottom-[-60px] right-[-30px]" />

      <main className="relative z-10 max-w-4xl mx-auto space-y-6">
        {/* Cabecera con selector A / B, dispositivo y pruebas en celular */}
        <PrototypeHeader
          currentMode={prototypeMode}
          onModeChange={setPrototypeMode}
          viewportMode={viewportMode}
          onViewportChange={setViewportMode}
          onOpenAudit={() => setIsAuditModalOpen(true)}
          onOpenMobileTesting={() => setIsMobileTestingOpen(true)}
        />

        {/* Vista activa según el modo y el dispositivo seleccionado */}
        {viewportMode === 'iphone' ? (
          <IPhoneFrame>
            {activeModuleContent}
          </IPhoneFrame>
        ) : (
          activeModuleContent
        )}
      </main>

      {/* Barra de herramientas inferior para inyectar datos de estrés (Break-UI) */}
      <BreakUiToolbar
        currentMode={breakMode}
        onModeChange={setBreakMode}
        isHidden={isAnyModalOpen}
      />

      {/* Modal interactivo de Auditoría y Comparativa de Estándares */}
      <AuditComparisonModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />

      {/* Modal interactivo para pruebas de campo en celular real */}
      <MobileTestingModal
        isOpen={isMobileTestingOpen}
        onClose={() => setIsMobileTestingOpen(false)}
      />
    </div>
  );
}
