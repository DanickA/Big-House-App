/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlantaCard, { Planta } from '@/components/plantas/PlantaCard';

jest.mock('@/actions/plantas', () => ({
  registrarCuidado: jest.fn().mockResolvedValue({ success: true }),
}));

const mockPlanta: Planta = {
  id: 'plant-123',
  nombre_comun: 'Monstera Deliciosa',
  especie: 'Monstera deliciosa',
  ubicacion: 'Sala principal',
  foto_url: 'https://images.unsplash.com/photo-test',
  diasRestantes: 3,
  frecuencia_dias: 7,
};

describe('PlantaCard Component Tests', () => {
  const onSelect = jest.fn();
  const onEdit = jest.fn();
  const onDelete = jest.fn();
  const onOpenHistorial = jest.fn();
  const onQuickWater = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Default window width for desktop
    window.innerWidth = 1024;
  });

  it('renders plant information with responsive layout and badges', () => {
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
    expect(screen.getByText('Monstera deliciosa')).toBeInTheDocument();
    expect(screen.getByText('Sala principal')).toBeInTheDocument();
    expect(screen.getByText('7d')).toBeInTheDocument();
  });

  it('renders PullDownMenu and mounts popover into document.body portal on desktop', async () => {
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

    const menuTrigger = screen.getByRole('button', { name: /opciones de la planta monstera deliciosa/i });
    expect(menuTrigger).toBeInTheDocument();

    // Menu should not be open yet
    expect(screen.queryByText('Eliminar planta')).not.toBeInTheDocument();

    // Click menu trigger
    fireEvent.click(menuTrigger);

    // Popover item 'Eliminar planta' should now be in document.body
    const deleteButton = await screen.findByText('Eliminar planta');
    expect(deleteButton).toBeInTheDocument();

    // Verify it triggers onDelete when clicked
    fireEvent.click(deleteButton);
    expect(onDelete).toHaveBeenCalledWith(mockPlanta);
  });

  it('calls onEdit and onOpenHistorial from the pull-down menu', async () => {
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

    const menuTrigger = screen.getByRole('button', { name: /opciones de la planta monstera deliciosa/i });
    fireEvent.click(menuTrigger);

    const editButton = await screen.findByText('Editar planta...');
    fireEvent.click(editButton);
    expect(onEdit).toHaveBeenCalledWith(mockPlanta);

    fireEvent.click(menuTrigger);
    const historyButton = await screen.findByText('Ver bitácora de cuidados...');
    fireEvent.click(historyButton);
    expect(onOpenHistorial).toHaveBeenCalledWith(mockPlanta);
  });

  it('calls onQuickWater when selecting the watering option', async () => {
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

    const menuTrigger = screen.getByRole('button', { name: /opciones de la planta monstera deliciosa/i });
    fireEvent.click(menuTrigger);

    const waterOption = await screen.findByText('Regar ahora (1 toque)');
    await act(async () => {
      fireEvent.click(waterOption);
    });

    expect(onQuickWater).toHaveBeenCalledWith(mockPlanta);
  });
});
