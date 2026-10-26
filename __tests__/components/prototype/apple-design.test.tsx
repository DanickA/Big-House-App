/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';

import AppleDesignPrototypePage from '@/app/prototype/apple-design/page';
import FluidBottomSheet from '@/components/prototype/apple-design/FluidBottomSheet';
import SquashStretchSwitch from '@/components/prototype/apple-design/SquashStretchSwitch';
import AnchoredPopover from '@/components/prototype/apple-design/AnchoredPopover';
import {
  getSafeInitials,
  formatMemberCount,
  formatCOP,
  DEMO_MEMBERS,
  WORST_CASE_MEMBERS,
} from '@/components/prototype/apple-design/fixtures';

describe('Break-UI helpers & fixtures', () => {
  it('getSafeInitials handles standard names, single names and emoji prefixes', () => {
    expect(getSafeInitials('Sofía Gómez')).toBe('SG');
    expect(getSafeInitials('Carlos')).toBe('CA');
    expect(getSafeInitials('🌱 Jo')).toBe('JO');
    expect(getSafeInitials('Bartholomew Montgomery III')).toBe('BI');
    expect(getSafeInitials('')).toBe('??');
  });

  it('getSafeInitials handles lone Unicode emojis without corrupting surrogate pairs', () => {
    // Carácter astral de 4 bytes (surrogate pair)
    expect(getSafeInitials('😀')).toBe('😀');
    expect(getSafeInitials('   ')).toBe('??');
  });

  it('formatMemberCount formats singular and plural strictly without "1 miembros"', () => {
    expect(formatMemberCount(0)).toBe('0 miembros');
    expect(formatMemberCount(1)).toBe('1 miembro');
    expect(formatMemberCount(2)).toBe('2 miembros');
    expect(formatMemberCount(15)).toBe('15 miembros');
  });

  it('formatCOP formats currency amounts reliably', () => {
    const formatted = formatCOP(180000);
    expect(formatted).toContain('180.000');
  });
});

describe('SquashStretchSwitch component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('toggles value on click', () => {
    const onChangeMock = jest.fn();
    render(
      <SquashStretchSwitch
        checked={false}
        onChange={onChangeMock}
        label="Test Switch"
      />
    );

    const switchEl = screen.getByRole('switch');
    expect(switchEl).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(switchEl);
    expect(onChangeMock).toHaveBeenCalledWith(true);
  });

  it('applies GPU composite squash & stretch without layout reflow (fixed 27px, scaleX(1.222) scaleY(0.92))', () => {
    const onChangeMock = jest.fn();
    const { container } = render(
      <SquashStretchSwitch
        checked={false}
        onChange={onChangeMock}
        label="Physics Switch"
      />
    );

    const switchEl = screen.getByRole('switch');
    const knob = container.querySelector('.switch-thumb-shadow') as HTMLElement;
    expect(knob).toBeInTheDocument();

    // El ancho de layout siempre es estrictamente 27px (0 mutación de layout / 0 reflow)
    expect(knob.style.width).toBe('27px');
    expect(knob.style.height).toBe('27px');
    expect(knob.style.transform).toContain('scaleX(1)');
    expect(knob.style.transform).toContain('scaleY(1)');

    // Al presionar: se activa la deformación compuesta en GPU (scaleX 1.222, scaleY 0.92)
    fireEvent.pointerDown(switchEl);
    expect(knob.style.width).toBe('27px'); // Permanece 27px (sin reflow)
    expect(knob.style.transform).toContain('scaleX(1.222)');
    expect(knob.style.transform).toContain('scaleY(0.92)');

    // Al soltar: recupera el estado relajado unitario (scaleX 1, scaleY 1)
    fireEvent.pointerUp(switchEl);
    expect(knob.style.width).toBe('27px');
    expect(knob.style.transform).toContain('scaleX(1)');
    expect(knob.style.transform).toContain('scaleY(1)');
  });

  it('supports keyboard toggle with Space or Enter', () => {
    const onChangeMock = jest.fn();
    render(
      <SquashStretchSwitch
        checked={true}
        onChange={onChangeMock}
        label="Keyboard Switch"
      />
    );

    const switchEl = screen.getByRole('switch');
    fireEvent.keyDown(switchEl, { key: ' ' });
    expect(onChangeMock).toHaveBeenCalledWith(false);

    fireEvent.keyDown(switchEl, { key: 'Enter' });
    expect(onChangeMock).toHaveBeenCalledWith(false);
  });
});

describe('AnchoredPopover component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens and closes anchored popover cleanly', () => {
    render(
      <AnchoredPopover
        trigger={({ toggle }) => (
          <button onClick={toggle} data-testid="popover-trigger">
            Opciones
          </button>
        )}
      >
        {({ close }) => (
          <div>
            <span>Contenido Popover</span>
            <button onClick={close} data-testid="popover-close">
              Cerrar
            </button>
          </div>
        )}
      </AnchoredPopover>
    );

    expect(screen.queryByText('Contenido Popover')).not.toBeInTheDocument();

    // Abrir
    fireEvent.click(screen.getByTestId('popover-trigger'));
    expect(screen.getByText('Contenido Popover')).toBeInTheDocument();

    // Cerrar
    fireEvent.click(screen.getByTestId('popover-close'));
    expect(screen.queryByText('Contenido Popover')).not.toBeInTheDocument();
  });
});

describe('FluidBottomSheet component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    if (typeof Element.prototype.setPointerCapture !== 'function') {
      Element.prototype.setPointerCapture = jest.fn();
    }
    if (typeof Element.prototype.releasePointerCapture !== 'function') {
      Element.prototype.releasePointerCapture = jest.fn();
    }
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders title, content and handles close button with symmetric exit', () => {
    const onCloseMock = jest.fn();
    render(
      <FluidBottomSheet
        isOpen={true}
        onClose={onCloseMock}
        title="Gaveta de Prueba"
        subtitle="Subtítulo descriptivo"
      >
        <p>Cuerpo de la gaveta</p>
      </FluidBottomSheet>
    );

    expect(screen.getByText('Gaveta de Prueba')).toBeInTheDocument();
    expect(screen.getByText('Subtítulo descriptivo')).toBeInTheDocument();
    expect(screen.getByText('Cuerpo de la gaveta')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /cerrar gaveta/i });
    fireEvent.click(closeBtn);

    // Debe esperar el timeout de salida simétrica (280ms)
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(onCloseMock).toHaveBeenCalled();
  });

  it('clicking close button does NOT initiate drag or set pointer capture', () => {
    const setPointerCaptureMock = jest.fn();
    Element.prototype.setPointerCapture = setPointerCaptureMock;

    render(
      <FluidBottomSheet
        isOpen={true}
        onClose={jest.fn()}
        title="Gaveta de Prueba"
      >
        <p>Cuerpo</p>
      </FluidBottomSheet>
    );

    const closeBtn = screen.getByRole('button', { name: /cerrar gaveta/i });
    fireEvent.pointerDown(closeBtn);

    expect(setPointerCaptureMock).not.toHaveBeenCalled();
  });

  it('handles Escape key to close symmetrically', () => {
    const onCloseMock = jest.fn();
    render(
      <FluidBottomSheet
        isOpen={true}
        onClose={onCloseMock}
        title="Gaveta de Prueba"
      >
        <p>Cuerpo</p>
      </FluidBottomSheet>
    );

    fireEvent.keyDown(window, { key: 'Escape' });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(onCloseMock).toHaveBeenCalled();
  });

  const createPointerEvent = (type: string, clientY: number, pointerId = 1) => {
    const event = new Event(type, { bubbles: true });
    Object.assign(event, { clientY, pointerId });
    return event;
  };

  it('handles drag-to-dismiss when dragging past 40% height threshold', () => {
    const onCloseMock = jest.fn();
    const { container } = render(
      <FluidBottomSheet
        isOpen={true}
        onClose={onCloseMock}
        title="Gaveta Arrastrable"
      >
        <p>Cuerpo</p>
      </FluidBottomSheet>
    );

    const sheet = (document.body.querySelector('.sheet-fluid-container') || container.querySelector('.sheet-fluid-container')) as HTMLElement;
    Object.defineProperty(sheet, 'offsetHeight', { value: 500, configurable: true });

    const dragHandle = (document.body.querySelector('[data-drag-handle]') || container.querySelector('[data-drag-handle]')) as HTMLElement;
    expect(dragHandle).toBeInTheDocument();

    // Iniciar arrastre en y=100
    fireEvent(dragHandle, createPointerEvent('pointerdown', 100));

    // Arrastrar hacia abajo a y=350 (delta = 250px, que es 50% de 500px, > 40%)
    fireEvent(sheet, createPointerEvent('pointermove', 350));

    // Soltar
    fireEvent(sheet, createPointerEvent('pointerup', 350));

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(onCloseMock).toHaveBeenCalled();
  });

  it('handles upward drag with rubber-band resistance and returns without dismissing', () => {
    const onCloseMock = jest.fn();
    const { container } = render(
      <FluidBottomSheet
        isOpen={true}
        onClose={onCloseMock}
        title="Gaveta Rubber-band"
      >
        <p>Cuerpo</p>
      </FluidBottomSheet>
    );

    const sheet = (document.body.querySelector('.sheet-fluid-container') || container.querySelector('.sheet-fluid-container')) as HTMLElement;
    Object.defineProperty(sheet, 'offsetHeight', { value: 500, configurable: true });

    const dragHandle = (document.body.querySelector('[data-drag-handle]') || container.querySelector('[data-drag-handle]')) as HTMLElement;

    // Arrastrar hacia arriba (y: 200 -> 100, delta = -100)
    fireEvent(dragHandle, createPointerEvent('pointerdown', 200));
    fireEvent(sheet, createPointerEvent('pointermove', 100));
    fireEvent(sheet, createPointerEvent('pointerup', 100));

    act(() => {
      jest.advanceTimersByTime(350);
    });

    // NO debe cerrarse
    expect(onCloseMock).not.toHaveBeenCalled();
  });


});

describe('AppleDesignPrototypePage integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header, switches between Modo A and Modo B', () => {
    render(<AppleDesignPrototypePage />);

    // Inicia en Modo B (Apple Craft)
    expect(screen.getByText('Modo B · Estándares Apple HIG + Emil Kowalski Craft')).toBeInTheDocument();

    // Cambiar a Modo A
    const btnModoA = screen.getByRole('button', { name: /Modo A · Actual/i });
    fireEvent.click(btnModoA);

    expect(screen.getByText('Modo A · Comportamiento Actual del Sistema')).toBeInTheDocument();
  });

  it('switches Break-UI datasets cleanly (Demo, Worst, 1 miembro, Vacía)', () => {
    render(<AppleDesignPrototypePage />);

    // Por defecto Demo data (3 miembros)
    expect(screen.getByText('Sofía Gómez')).toBeInTheDocument();

    // Cambiar a Worst-case data
    const btnWorst = screen.getByRole('button', { name: /Worst-case/i });
    fireEvent.click(btnWorst);

    expect(screen.getByText('Aleksandra Wiśniewska-Kowalczyk')).toBeInTheDocument();
    expect(
      screen.getByText('bartholomew.fitzgerald@northwind-industries-holdings.example.com')
    ).toBeInTheDocument();

    // Cambiar a 1 miembro (verificar pluralización estricta "1 miembro")
    const btnSingle = screen.getByRole('button', { name: /1 miembro/i });
    fireEvent.click(btnSingle);

    const singleMemberElements = screen.getAllByText('1 miembro');
    expect(singleMemberElements.length).toBeGreaterThanOrEqual(2); // Badge de cabecera y botón del toolbar
    expect(screen.queryByText('1 miembros')).not.toBeInTheDocument();

    // Cambiar a lista vacía
    const btnEmpty = screen.getByRole('button', { name: /Lista vacía/i });
    fireEvent.click(btnEmpty);

    expect(screen.getByText('No hay habitantes registrados')).toBeInTheDocument();
  });

  it('opens and closes the Audit Comparison Modal', () => {
    render(<AppleDesignPrototypePage />);

    const btnAudit = screen.getByRole('button', { name: /Ver Tabla de Auditoría/i });
    fireEvent.click(btnAudit);

    expect(screen.getByText('Auditoría Comparativa · Emil Kowalski & Break-UI')).toBeInTheDocument();
    expect(screen.getByText('1. Tabla de Hallazgos de Craft (Emil Kowalski Review Format)')).toBeInTheDocument();
    expect(screen.getByText('2. Tabla de Roturas y Salvaguardas (`break-ui`)')).toBeInTheDocument();

    // Cerrar modal
    const btnClose = screen.getByRole('button', { name: /Entendido/i });
    fireEvent.click(btnClose);

    expect(screen.queryByText('Auditoría Comparativa · Emil Kowalski & Break-UI')).not.toBeInTheDocument();
  });

  it('switches to iPhone 16 Pro simulator canvas and renders Dynamic Island & status bar', () => {
    render(<AppleDesignPrototypePage />);

    // Por defecto inicia en Pantalla Completa
    expect(screen.queryByText('iPhone 16 Pro (393 × 852)')).not.toBeInTheDocument();

    // Activar iPhone 16 Pro
    const btnIphone = screen.getByRole('button', { name: /iPhone 16 Pro/i });
    fireEvent.click(btnIphone);

    // Debe mostrar la cabecera del simulador iPhone y la Dynamic Island
    expect(screen.getByText('iPhone 16 Pro (393 × 852)')).toBeInTheDocument();
    expect(screen.getByTitle(/Toca para interactuar con la Dynamic Island/i)).toBeInTheDocument();
  });

  it('opens and closes the Mobile Testing modal with QR and Wi-Fi instructions', () => {
    render(<AppleDesignPrototypePage />);

    const btnMobile = screen.getByRole('button', { name: /Probar en Celular/i });
    fireEvent.click(btnMobile);

    expect(screen.getByText('Probar en tu Celular (iOS / Android)')).toBeInTheDocument();
    expect(screen.getByText('Escanea con tu cámara')).toBeInTheDocument();
    expect(screen.getByText('npm run dev:mobile')).toBeInTheDocument();

    // Cerrar modal
    const btnClose = screen.getByRole('button', { name: /Cerrar ventana de prueba móvil/i });
    fireEvent.click(btnClose);

    expect(screen.queryByText('Probar en tu Celular (iOS / Android)')).not.toBeInTheDocument();
  });

  it('hides the BreakUiToolbar smoothly when a habitante sheet is opened', () => {
    const { container } = render(<AppleDesignPrototypePage />);

    const toolbar = container.querySelector('aside[aria-label="Selector de datos break-ui"]');
    expect(toolbar).toHaveClass('opacity-100');

    // Abrir gaveta de un habitante
    const openBtn = screen.getByRole('button', { name: /Detalles de Sofía Gómez/i });
    fireEvent.click(openBtn);

    // La barra debe esconderse para no tapar los botones
    expect(toolbar).toHaveClass('opacity-0');
  });
});

describe('Habitantes Prototype Navigation & Break-UI Modes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Habitantes Apple Craft view by default and switches between Modo Actual and Apple Craft', () => {
    render(<AppleDesignPrototypePage />);

    // Initial view: Modo Apple Craft (Habitantes)
    expect(screen.getByText(/Modo B · Estándares Apple HIG \+ Emil Kowalski Craft/i)).toBeInTheDocument();
    expect(screen.getByText(/Habitantes del Hogar/i)).toBeInTheDocument();
    expect(screen.getByText('Sofía Gómez')).toBeInTheDocument();

    // Switch to Modo Actual
    const btnActual = screen.getByRole('button', { name: /Modo A · Actual/i });
    fireEvent.click(btnActual);

    expect(screen.getByText(/Modo A · Comportamiento Actual del Sistema/i)).toBeInTheDocument();

    // Switch back to Apple Craft
    const btnApple = screen.getByRole('button', { name: /Modo B · Apple Design/i });
    fireEvent.click(btnApple);

    expect(screen.getByText(/Modo B · Estándares Apple HIG \+ Emil Kowalski Craft/i)).toBeInTheDocument();
  });

  it('switches Break-UI stress modes seamlessly (Demo, Worst-case, Single, Empty)', () => {
    render(<AppleDesignPrototypePage />);

    // 1. Initial Demo mode
    expect(screen.getByText('Sofía Gómez')).toBeInTheDocument();

    // 2. Select Worst-case mode
    fireEvent.click(screen.getByRole('button', { name: /Worst-case/i }));
    expect(screen.getByText(/Aleksandra Wiśniewska-Kowalczyk/i)).toBeInTheDocument();
    expect(screen.getByText(/🌱 Jo/i)).toBeInTheDocument();

    // 3. Select 1 habitante (Single member)
    fireEvent.click(screen.getByRole('button', { name: /1 miembro/i }));
    expect(screen.getByText('Alejandro Soto')).toBeInTheDocument();
    expect(screen.getAllByText('1 miembro').length).toBeGreaterThanOrEqual(1);

    // 4. Select Empty mode
    fireEvent.click(screen.getByRole('button', { name: /Lista vacía/i }));
    expect(screen.getByText(/No hay habitantes registrados/i)).toBeInTheDocument();
  });

  it('renders inside iPhone 16 Pro simulator frame when simulator view is selected', () => {
    render(<AppleDesignPrototypePage initialViewport="iphone" />);

    // Check simulator root exists
    const screenRoot = document.getElementById('iphone-screen-root');
    expect(screenRoot).toBeInTheDocument();
    expect(screen.getByText('iPhone 16 Pro (393 × 852)')).toBeInTheDocument();
    expect(screen.getByText(/Habitantes del Hogar/i)).toBeInTheDocument();
  });
});



