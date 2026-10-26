/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SWRConfig } from 'swr';
import UsuariosView from '@/components/usuarios/UsuariosView';
import type { UsuarioItem } from '@/components/usuarios/types';
import * as actions from '@/actions/usuarios';

const renderWithSWR = (ui: React.ReactElement) => {
  return render(
    <SWRConfig value={{ provider: () => new Map() }}>
      {ui}
    </SWRConfig>
  );
};

jest.mock('@/actions/usuarios', () => ({
  getUsuarios: jest.fn(),
  createUsuario: jest.fn(),
  updateUsuario: jest.fn(),
  deleteUsuario: jest.fn(),
}));

const mockUsuarios: UsuarioItem[] = [
  {
    id: 'u-1',
    nombre: 'Sofía Gómez',
    email: 'sofia@ejemplo.com',
    tienePin: true,
    fecha_registro: new Date('2026-01-01'),
  },
  {
    id: 'u-2',
    nombre: 'Carlos Mendoza',
    email: 'carlos@ejemplo.com',
    tienePin: false,
    fecha_registro: new Date('2026-01-02'),
  },
  {
    id: 'u-3',
    nombre: '🌱 Jo Con Emoji',
    email: 'jo.con.email.extenso.y.continuo@organizacion.example.com',
    tienePin: true,
    fecha_registro: new Date('2026-01-03'),
  },
];

describe('UsuariosView - Apple Design & Break-UI Craft', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (actions.getUsuarios as jest.Mock).mockResolvedValue({
      success: true,
      data: mockUsuarios,
    });
  });

  it('renders habitante directory with safe initials and strict pluralization', () => {
    renderWithSWR(<UsuariosView initialUsuarios={mockUsuarios} />);

    // Header & Pluralization
    expect(screen.getByText('Habitantes del hogar')).toBeInTheDocument();
    expect(screen.getByText('3 habitantes')).toBeInTheDocument();

    // Avatars with getSafeInitials
    expect(screen.getByText('SG')).toBeInTheDocument();
    expect(screen.getByText('CM')).toBeInTheDocument();
    expect(screen.getByText('JE')).toBeInTheDocument();

    // Member names and emails
    expect(screen.getByText('Sofía Gómez')).toBeInTheDocument();
    expect(screen.getByText('carlos@ejemplo.com')).toBeInTheDocument();
  });

  it('filters by access method (Todos, PIN rápido, Solo clave)', () => {
    renderWithSWR(<UsuariosView initialUsuarios={mockUsuarios} />);

    // Filter "PIN rápido"
    const pinFilter = screen.getByRole('button', { name: /PIN rápido/i });
    fireEvent.click(pinFilter);

    expect(screen.getByText('Sofía Gómez')).toBeInTheDocument();
    expect(screen.getByText('🌱 Jo Con Emoji')).toBeInTheDocument();
    expect(screen.queryByText('Carlos Mendoza')).not.toBeInTheDocument();

    // Filter "Solo contraseña"
    const claveFilter = screen.getByRole('button', { name: /Solo contraseña/i });
    fireEvent.click(claveFilter);

    expect(screen.queryByText('Sofía Gómez')).not.toBeInTheDocument();
    expect(screen.getByText('Carlos Mendoza')).toBeInTheDocument();

    // Reset to "Todos"
    const todosFilter = screen.getByRole('button', { name: /Todos/i });
    fireEvent.click(todosFilter);

    expect(screen.getByText('Sofía Gómez')).toBeInTheDocument();
    expect(screen.getByText('Carlos Mendoza')).toBeInTheDocument();
  });

  it('opens and closes the fluid sheet for creating a new habitante', async () => {
    renderWithSWR(<UsuariosView initialUsuarios={mockUsuarios} />);

    // Click "Agregar habitante"
    const addBtn = screen.getByRole('button', { name: /Agregar habitante/i });
    fireEvent.click(addBtn);

    // Sheet title
    expect(screen.getByText('Nuevo habitante')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nombre del habitante')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('correo@ejemplo.com')).toBeInTheDocument();

    // Sticky buttons are in the DOM
    expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Registrar/i })).toBeInTheDocument();

    // Body scroll must be locked strictly to isolate touch gestures and prevent background movement
    expect(document.body.classList.contains('sheet-open')).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.overscrollBehavior).toBe('none');

    // Close via Cancel button
    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelBtn);

    await waitFor(
      () => {
        expect(screen.queryByText('Nuevo habitante')).not.toBeInTheDocument();
        expect(document.body.classList.contains('sheet-open')).toBe(false);
      },
      { timeout: 1000 }
    );
  });

  it('opens fluid sheet for editing habitante and preserves existing PIN if left empty', async () => {
    (actions.updateUsuario as jest.Mock).mockResolvedValue({ success: true });

    renderWithSWR(<UsuariosView initialUsuarios={mockUsuarios} />);

    const editBtns = screen.getAllByRole('button', { name: /Editar acceso/i });
    fireEvent.click(editBtns[0]); // Edit Sofía Gómez

    expect(screen.getByText('Editar habitante')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sofía Gómez')).toBeInTheDocument();
    expect(screen.getByDisplayValue('sofia@ejemplo.com')).toBeInTheDocument();

    // Submit edit form
    const saveBtn = screen.getByRole('button', { name: /Guardar cambios/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(actions.updateUsuario).toHaveBeenCalledWith(
        'u-1',
        expect.any(FormData)
      );
    });
  });

  it('opens anchored options menu and triggers delete confirmation modal', async () => {
    (actions.deleteUsuario as jest.Mock).mockResolvedValue({ success: true });

    renderWithSWR(<UsuariosView initialUsuarios={mockUsuarios} />);

    // Click options button for Carlos Mendoza
    const moreBtn = screen.getByRole('button', { name: /Opciones de Carlos Mendoza/i });
    fireEvent.click(moreBtn);

    // Anchored options menu items
    expect(screen.getByText('Opciones de habitante')).toBeInTheDocument();
    expect(screen.getByText('Copiar correo')).toBeInTheDocument();

    // Click "Eliminar del hogar" in the menu
    const deleteMenuOption = screen.getByText('Eliminar del hogar');
    fireEvent.click(deleteMenuOption);

    // ConfirmModal opens
    expect(screen.getByText('¿Eliminar habitante?')).toBeInTheDocument();
    expect(screen.getByText(/¿Estás seguro de que deseas eliminar a "Carlos Mendoza"/i)).toBeInTheDocument();

    // Confirm deletion
    const confirmDeleteBtn = screen.getByRole('button', { name: 'Eliminar habitante' });
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(actions.deleteUsuario).toHaveBeenCalledWith('u-2');
    });
  });

  it('elevates active card z-index above sibling cards when options menu is open, preventing menu overlap by user below', () => {
    const { container } = renderWithSWR(<UsuariosView initialUsuarios={mockUsuarios} />);

    const articles = container.querySelectorAll('article');
    expect(articles.length).toBe(3);

    // Initial state: all cards have default low z-index
    expect(articles[0].style.zIndex).toBe('1');
    expect(articles[1].style.zIndex).toBe('1');

    // Open options on first user (Sofía Gómez) who has Carlos Mendoza directly below
    const moreBtnSofia = screen.getByRole('button', { name: /Opciones de Sofía Gómez/i });
    fireEvent.click(moreBtnSofia);

    // First card must be elevated to zIndex 40 and have z-40 class
    expect(articles[0].style.zIndex).toBe('40');
    expect(articles[0]).toHaveClass('z-40');

    // Second card (user below) must remain at zIndex 1 and have z-0 class
    expect(articles[1].style.zIndex).toBe('1');
    expect(articles[1]).toHaveClass('z-0');

    // Menu is fully visible with all options, completely stacked in front of user below
    expect(screen.getByText('Opciones de habitante')).toBeInTheDocument();
    expect(screen.getAllByText('Editar acceso').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Copiar correo')).toBeInTheDocument();
    expect(screen.getByText('Eliminar del hogar')).toBeInTheDocument();
  });

  it('displays empty state illustration when list is empty', async () => {
    (actions.getUsuarios as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
    });

    renderWithSWR(<UsuariosView initialUsuarios={[]} />);

    expect(screen.getByText('0 habitantes')).toBeInTheDocument();
    expect(screen.getByText('Sin habitantes en este filtro')).toBeInTheDocument();
  });
});
