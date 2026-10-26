/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SWRConfig } from 'swr';
import FinanzasView, { HabitanteOption } from '@/components/pagos/FinanzasView';
import type {
  ServicioConEstado,
  ResumenServicios,
  ResumenFondoComunMes,
} from '@/actions/pagos';
import * as actions from '@/actions/pagos';

jest.mock('@/actions/pagos', () => ({
  getServicios: jest.fn(),
  createServicio: jest.fn(),
  updateServicio: jest.fn(),
  deleteServicio: jest.fn(),
  registrarPagoServicio: jest.fn(),
  getHistorialPagos: jest.fn(),
  getFondoComunMes: jest.fn(),
  registrarAporteFondo: jest.fn(),
  deleteAporteFondo: jest.fn(),
}));

const mockHabitantes: HabitanteOption[] = [
  { id: 'hab-1', nombre: 'Laura Restrepo', email: 'laura@ejemplo.com' },
  { id: 'hab-2', nombre: 'Andrés Gómez', email: 'andres@ejemplo.com' },
];

const mockServicios: ServicioConEstado[] = [
  {
    id: 'serv-1',
    nombre_servicio: 'Internet Fibra Óptica',
    monto: 120000,
    fecha_vencimiento: '2026-11-15T00:00:00.000Z',
    dia_vencimiento: 15,
    periodicidad_meses: 1,
    numero_cuenta: 'ACC-9988',
    numero_factura: 'FAC-1234',
    estado: 'ACTIVO',
    estadoVencimiento: 'POR_VENCER',
    diasRestantes: 5,
    responsable_id: 'hab-1',
    responsable: { id: 'hab-1', nombre: 'Laura Restrepo' },
    pagadoEnMesConsultado: false,
  },
  {
    id: 'serv-2',
    nombre_servicio: 'Energía Enel',
    monto: 85000,
    fecha_vencimiento: '2026-11-02T00:00:00.000Z',
    dia_vencimiento: 2,
    periodicidad_meses: 1,
    numero_cuenta: 'ENEL-5544',
    numero_factura: 'FAC-8877',
    estado: 'ACTIVO',
    estadoVencimiento: 'VENCIDO',
    diasRestantes: -2,
    responsable_id: 'hab-2',
    responsable: { id: 'hab-2', nombre: 'Andrés Gómez' },
    pagadoEnMesConsultado: false,
  },
  {
    id: 'serv-3',
    nombre_servicio: 'Agua Acueducto',
    monto: 65000,
    fecha_vencimiento: '2026-11-20T00:00:00.000Z',
    dia_vencimiento: 20,
    periodicidad_meses: 1,
    numero_cuenta: 'AGUA-1122',
    numero_factura: 'FAC-9900',
    estado: 'ACTIVO',
    estadoVencimiento: 'PAGADO',
    diasRestantes: 10,
    responsable_id: 'hab-1',
    responsable: { id: 'hab-1', nombre: 'Laura Restrepo' },
    pagadoEnMesConsultado: true,
    pagoMesConsultado: {
      id: 'pago-1',
      fecha_pago: '2026-11-05T00:00:00.000Z',
      monto_pagado: 65000,
      monto_presupuestado: 65000,
      comprobante_url: null,
    },
  },
];

const mockResumen: ResumenServicios = {
  totalServicios: 3,
  totalPresupuestoMensual: 270000,
  totalProximosVencimientos: 120000,
  cuentasVencidas: 1,
  cuentasPorVencer: 1,
  cuentasAlDia: 0,
  totalRealPagadoMes: 65000,
  totalPorPagarMes: 205000,
  diferenciaPresupuestoGlobal: 0,
};

const mockFondo: ResumenFondoComunMes = {
  periodoMes: '2026-11',
  presupuestoMesRecaudado: 400000,
  aportes: [
    {
      id: 'ap-1',
      usuario_id: 'hab-1',
      usuario: { id: 'hab-1', nombre: 'Laura Restrepo' },
      monto: 200000,
      fecha: '2026-11-01T10:00:00.000Z',
      periodo_mes: '2026-11',
      descripcion: 'Aporte mensual Laura',
      comprobante_url: null,
    },
    {
      id: 'ap-2',
      usuario_id: 'hab-2',
      usuario: { id: 'hab-2', nombre: 'Andrés Gómez' },
      monto: 200000,
      fecha: '2026-11-02T10:00:00.000Z',
      periodo_mes: '2026-11',
      descripcion: 'Aporte mensual Andrés',
      comprobante_url: null,
    },
  ],
  porHabitante: [
    {
      usuario_id: 'hab-1',
      nombre: 'Laura Restrepo',
      totalAportado: 200000,
      cantidadAportes: 1,
      ultimoAporte: null,
    },
    {
      usuario_id: 'hab-2',
      nombre: 'Andrés Gómez',
      totalAportado: 200000,
      cantidadAportes: 1,
      ultimoAporte: null,
    },
  ],
};

const renderWithSWR = (ui: React.ReactElement) => {
  return render(
    <SWRConfig value={{ provider: () => new Map() }}>
      {ui}
    </SWRConfig>
  );
};

describe('FinanzasView Component Tests (Real UI)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (actions.getServicios as jest.Mock).mockResolvedValue({
      success: true,
      servicios: mockServicios,
      resumen: mockResumen,
    });
    (actions.getFondoComunMes as jest.Mock).mockResolvedValue({
      success: true,
      data: mockFondo,
    });
    (actions.getHistorialPagos as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
    });
  });

  it('renders pending and paid service items with proper amounts and indicators', () => {
    renderWithSWR(
      <FinanzasView
        initialServicios={mockServicios}
        initialResumen={mockResumen}
        initialFondoComun={mockFondo}
        initialHabitantes={mockHabitantes}
        currentUserId="hab-1"
      />
    );

    // Header & Navigation buttons
    expect(screen.getByRole('button', { name: /Recibos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Fondo Común/i })).toBeInTheDocument();

    // Services rendered
    expect(screen.getByText('Internet Fibra Óptica')).toBeInTheDocument();
    expect(screen.getByText('Energía Enel')).toBeInTheDocument();
    expect(screen.getByText('Agua Acueducto')).toBeInTheDocument();

    // Due state indicators
    expect(screen.getByText(/Vence en 5d/i)).toBeInTheDocument();
    expect(screen.getByText(/En mora \(2d\) · Riesgo corte/i)).toBeInTheDocument();

    // Format COP amounts
    expect(screen.getByText('$120.000')).toBeInTheDocument();
    expect(screen.getByText('$85.000')).toBeInTheDocument();
  });

  it('opens sliding sheet when clicking a service item and can close it', async () => {
    renderWithSWR(
      <FinanzasView
        initialServicios={mockServicios}
        initialResumen={mockResumen}
        initialFondoComun={mockFondo}
        initialHabitantes={mockHabitantes}
        currentUserId="hab-1"
      />
    );

    const internetItem = screen.getByText('Internet Fibra Óptica');
    fireEvent.click(internetItem);

    // Modal sheet appears with heading and tabs
    expect(await screen.findByRole('heading', { name: 'Internet Fibra Óptica' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pagar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Histórico/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Editar/i })).toBeInTheDocument();

    // Close button dismisses sheet
    const closeBtn = screen.getByRole('button', { name: 'Cerrar modal' });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Internet Fibra Óptica' })).not.toBeInTheDocument();
    });
  });

  it('switches between tabs in the sliding sheet', async () => {
    renderWithSWR(
      <FinanzasView
        initialServicios={mockServicios}
        initialResumen={mockResumen}
        initialFondoComun={mockFondo}
        initialHabitantes={mockHabitantes}
        currentUserId="hab-1"
      />
    );

    fireEvent.click(screen.getByText('Internet Fibra Óptica'));
    expect(await screen.findByRole('heading', { name: 'Internet Fibra Óptica' })).toBeInTheDocument();

    // Switch to Editar (configurar)
    fireEvent.click(screen.getByRole('button', { name: /Editar/i }));
    expect(screen.getByDisplayValue('Internet Fibra Óptica')).toBeInTheDocument();

    // Switch to Histórico
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Histórico/i }));
    });
    expect(actions.getHistorialPagos).toHaveBeenCalledWith('serv-1');
  });

  it('submits payment registration through sheet form', async () => {
    (actions.registrarPagoServicio as jest.Mock).mockResolvedValue({ success: true });

    renderWithSWR(
      <FinanzasView
        initialServicios={mockServicios}
        initialResumen={mockResumen}
        initialFondoComun={mockFondo}
        initialHabitantes={mockHabitantes}
        currentUserId="hab-1"
      />
    );

    fireEvent.click(screen.getByText('Internet Fibra Óptica'));
    expect(await screen.findByRole('heading', { name: 'Internet Fibra Óptica' })).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Confirmar pago y guardar recibo/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(actions.registrarPagoServicio).toHaveBeenCalled();
    });
  });

  it('navigates to Fondo Común tab and displays contributions', () => {
    renderWithSWR(
      <FinanzasView
        initialServicios={mockServicios}
        initialResumen={mockResumen}
        initialFondoComun={mockFondo}
        initialHabitantes={mockHabitantes}
        currentUserId="hab-1"
      />
    );

    const fondoTab = screen.getByRole('button', { name: /Fondo Común/i });
    fireEvent.click(fondoTab);

    // Fondo Común view shows contributions and action button
    expect(screen.getAllByText(/Aporte mensual Laura/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Aporte mensual Andrés/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Subir mi aporte/i })).toBeInTheDocument();
  });

  it('renders empty state when there are no registered services and allows opening creation modal', () => {
    (actions.getServicios as jest.Mock).mockResolvedValue({
      success: true,
      servicios: [],
      resumen: {
        totalServicios: 0,
        totalPresupuestoMensual: 0,
        totalProximosVencimientos: 0,
        cuentasVencidas: 0,
        cuentasPorVencer: 0,
        cuentasAlDia: 0,
        totalRealPagadoMes: 0,
        totalPorPagarMes: 0,
        diferenciaPresupuestoGlobal: 0,
      },
    });

    renderWithSWR(
      <FinanzasView
        initialServicios={[]}
        initialResumen={{
          totalServicios: 0,
          totalPresupuestoMensual: 0,
          totalProximosVencimientos: 0,
          cuentasVencidas: 0,
          cuentasPorVencer: 0,
          cuentasAlDia: 0,
          totalRealPagadoMes: 0,
          totalPorPagarMes: 0,
          diferenciaPresupuestoGlobal: 0,
        }}
        initialHabitantes={mockHabitantes}
        currentUserId="hab-1"
      />
    );

    expect(screen.getByText('Aún no hay servicios registrados')).toBeInTheDocument();
    const addBtn = screen.getByRole('button', { name: /Agregar primer servicio/i });
    expect(addBtn).toBeInTheDocument();

    fireEvent.click(addBtn);
    expect(screen.getByRole('heading', { name: 'Nuevo Servicio del Hogar' })).toBeInTheDocument();
  });

  it('displays error alert banner when payment registration fails', async () => {
    (actions.registrarPagoServicio as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Error de prueba: saldo insuficiente en cuenta',
    });

    renderWithSWR(
      <FinanzasView
        initialServicios={mockServicios}
        initialResumen={mockResumen}
        initialFondoComun={mockFondo}
        initialHabitantes={mockHabitantes}
        currentUserId="hab-1"
      />
    );

    fireEvent.click(screen.getByText('Internet Fibra Óptica'));
    expect(await screen.findByRole('heading', { name: 'Internet Fibra Óptica' })).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Confirmar pago y guardar recibo/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText('Error de prueba: saldo insuficiente en cuenta')
    ).toBeInTheDocument();
  });
});

