/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ServicioCard from '@/components/pagos/ServicioCard';
import { ServicioConEstado } from '@/actions/pagos';

const mockServicio: ServicioConEstado = {
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
};

describe('ServicioCard Component Tests', () => {
  const onRegistrarPago = jest.fn();
  const onVerHistorial = jest.fn();
  const onEdit = jest.fn();
  const onDelete = jest.fn();
  const onQuickPay = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all 3 actions with flexible non-overflowing classes when quickPay is enabled', () => {
    render(
      <ServicioCard
        servicio={mockServicio}
        onRegistrarPago={onRegistrarPago}
        onVerHistorial={onVerHistorial}
        onEdit={onEdit}
        onDelete={onDelete}
        onQuickPay={onQuickPay}
      />
    );

    const recibosBtn = screen.getByTitle('Ver recibos y comprobantes anteriores');
    const quickPayBtn = screen.getByTitle('Pago rápido del monto presupuestado exacto');
    const detallesBtn = screen.getByTitle('Personalizar monto, fecha o adjuntar comprobante');

    expect(recibosBtn).toBeInTheDocument();
    expect(quickPayBtn).toBeInTheDocument();
    expect(detallesBtn).toBeInTheDocument();

    // Verify both primary action buttons have flex-1 and min-w-0 to prevent horizontal overflow
    expect(quickPayBtn.className).toContain('flex-1');
    expect(quickPayBtn.className).toContain('min-w-0');
    expect(detallesBtn.className).toContain('flex-1');
    expect(detallesBtn.className).toContain('min-w-0');
  });

  it('triggers onVerHistorial when clicking recibos button', () => {
    render(
      <ServicioCard
        servicio={mockServicio}
        onRegistrarPago={onRegistrarPago}
        onVerHistorial={onVerHistorial}
        onEdit={onEdit}
        onDelete={onDelete}
        onQuickPay={onQuickPay}
      />
    );

    const recibosBtn = screen.getByTitle('Ver recibos y comprobantes anteriores');
    fireEvent.click(recibosBtn);
    expect(onVerHistorial).toHaveBeenCalledWith(mockServicio);
  });

  it('triggers onRegistrarPago when clicking detalles button', () => {
    render(
      <ServicioCard
        servicio={mockServicio}
        onRegistrarPago={onRegistrarPago}
        onVerHistorial={onVerHistorial}
        onEdit={onEdit}
        onDelete={onDelete}
        onQuickPay={onQuickPay}
      />
    );

    const detallesBtn = screen.getByTitle('Personalizar monto, fecha o adjuntar comprobante');
    fireEvent.click(detallesBtn);
    expect(onRegistrarPago).toHaveBeenCalledWith(mockServicio);
  });
});
