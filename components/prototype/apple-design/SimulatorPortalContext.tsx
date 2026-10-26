'use client';

import React, { createContext, useContext } from 'react';

interface SimulatorPortalContextValue {
  portalContainer: HTMLElement | null;
  isInsidePhone: boolean;
}

const SimulatorPortalContext = createContext<SimulatorPortalContextValue>({
  portalContainer: null,
  isInsidePhone: false,
});

export const SimulatorPortalProvider = SimulatorPortalContext.Provider;

export function useSimulatorPortal() {
  return useContext(SimulatorPortalContext);
}
