/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlantaCard, { Planta } from '@/components/plantas/PlantaCard';

jest.mock('@/actions/plantas', () => ({
  registrarCuidado: jest.fn().mockResolvedValue({ success: true }),
  getHistorialByPlanta: jest.fn().mockResolvedValue({ success: true, data: [] }),
  deshacerCuidado: jest.fn().mockResolvedValue({ success: true }),
}));

const mockPlanta: Planta = {
  id: 'plant-123',
  nombre_comun: 'Monstera Deliciosa',
  especie: 'Monstera deliciosa',
  ubicacion: 'Sala principal',
  foto_url: 'https://images.unsplash.com/photo-test',
  diasRestantes: 3,
  frecuencia_dias: 7,
  nivel_luz: 'INDIRECTA',
  nivel_agua: 'MODERADA',
  estado_salud: 'SANA',
  notas_cuidado: 'Atomizar hojas semanalmente',
};

describe('PlantaCard Component Tests (3B Capsule + In-Place Accordion)', () => {
  const onSelect = jest.fn();
  const onEdit = jest.fn();
  const onDelete = jest.fn();
  const onOpenHistorial = jest.fn();
  const onQuickWater = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders closed capsule with zero data duplication (only name, location, and single progress ring)', () => {
    render(
      <PlantaCard
        planta={mockPlanta}
        onSelect={onSelect}
        onEdit={onEdit}
        onDelete={onDelete}
        onOpenHistorial={onOpenHistorial}
        onQuickWater={onQuickWater}
      />
    );

    expect(screen.getByText('Monstera Deliciosa')).toBeInTheDocument();
    expect(screen.getByText('Sala principal')).toBeInTheDocument();
    expect(screen.getByText('3d')).toBeInTheDocument();

    // Progressive disclosure: secondary Care Guide details are hidden until expanded
    expect(screen.queryByText('Monstera deliciosa')).not.toBeInTheDocument();
    expect(screen.queryByText('Atomizar hojas semanalmente')).not.toBeInTheDocument();
  });

  it('expands in-place accordion on click to reveal Care Guide, actions, and edit/delete controls', async () => {
    render(
      <PlantaCard
        planta={mockPlanta}
        onSelect={onSelect}
        onEdit={onEdit}
        onDelete={onDelete}
        onOpenHistorial={onOpenHistorial}
        onQuickWater={onQuickWater}
      />
    );

    const capsuleToggle = screen.getByRole('button', {
      name: /opciones de la planta monstera deliciosa/i,
    });
    fireEvent.click(capsuleToggle);

    // Care Guide and actions are now visible inside the accordion
    expect(screen.getByText('Luz indirecta')).toBeInTheDocument();
    expect(screen.getByText('Agua moderada')).toBeInTheDocument();
    expect(screen.getByText('Monstera deliciosa')).toBeInTheDocument();
    expect(screen.getByText('Atomizar hojas semanalmente')).toBeInTheDocument();

    const deleteButton = screen.getByRole('button', { name: /eliminar planta/i });
    fireEvent.click(deleteButton);
    expect(onDelete).toHaveBeenCalledWith(mockPlanta);
  });

  it('calls onEdit and onOpenHistorial from the expanded accordion', async () => {
    render(
      <PlantaCard
        planta={mockPlanta}
        onSelect={onSelect}
        onEdit={onEdit}
        onDelete={onDelete}
        onOpenHistorial={onOpenHistorial}
        onQuickWater={onQuickWater}
      />
    );

    const capsuleToggle = screen.getByRole('button', {
      name: /opciones de la planta monstera deliciosa/i,
    });
    fireEvent.click(capsuleToggle);

    const editButton = screen.getByRole('button', { name: /editar planta/i });
    fireEvent.click(editButton);
    expect(onEdit).toHaveBeenCalledWith(mockPlanta);

    const historyTab = screen.getByRole('button', { name: /bitácora/i });
    await act(async () => {
      fireEvent.click(historyTab);
    });
    expect(onOpenHistorial).toHaveBeenCalledWith(mockPlanta);
  });

  it('calls onQuickWater when tapping the 1-tap water ring button', async () => {
    render(
      <PlantaCard
        planta={mockPlanta}
        onSelect={onSelect}
        onEdit={onEdit}
        onDelete={onDelete}
        onOpenHistorial={onOpenHistorial}
        onQuickWater={onQuickWater}
      />
    );

    const waterBtn = screen.getByRole('button', {
      name: /regar ahora a monstera deliciosa/i,
    });
    await act(async () => {
      fireEvent.click(waterBtn);
    });

    expect(onQuickWater).toHaveBeenCalledWith(mockPlanta);
  });
});
