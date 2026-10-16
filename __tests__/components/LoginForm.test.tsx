/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginForm from '@/components/auth/LoginForm';
import { MiembroSelector } from '@/actions/auth';

const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
  }),
}));

jest.mock('@/actions/auth', () => ({
  loginConCredenciales: jest.fn(),
  loginTradicional: jest.fn(),
}));

const mockMiembros: MiembroSelector[] = [
  {
    id: 'user-1',
    nombre: 'Daniel',
    email: 'daniel@hogar.com',
    tienePin: true,
    pinLongitud: 4,
  },
  {
    id: 'user-2',
    nombre: 'Pecas Macchi',
    email: 'pecas@hogar.com',
    tienePin: false,
    pinLongitud: 4,
  },
];

describe('LoginForm Component Interaction Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('renders member cards and alternative login button initially', () => {
    render(<LoginForm initialMiembros={mockMiembros} />);
    expect(screen.getByText('Daniel')).toBeInTheDocument();
    expect(screen.getByText('Pecas Macchi')).toBeInTheDocument();
    expect(screen.getByText('Ingresar con correo y contraseña')).toBeInTheDocument();
  });

  it('switches to traditional view when clicking "Ingresar con correo y contraseña"', () => {
    render(<LoginForm initialMiembros={mockMiembros} />);
    const traditionalBtn = screen.getByText('Ingresar con correo y contraseña');
    fireEvent.click(traditionalBtn);
    expect(screen.getByPlaceholderText('ejemplo@hogar.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Tu contraseña')).toBeInTheDocument();
  });

  it('selects user when clicking on user card', () => {
    render(<LoginForm initialMiembros={mockMiembros} />);
    const danielCard = screen.getByText('Daniel').closest('button');
    expect(danielCard).not.toBeNull();
    fireEvent.click(danielCard!);
    expect(screen.getByText('Ingresa tu PIN de 4 dígitos')).toBeInTheDocument();
  });

  it('allows switching to password input from PIN view', () => {
    render(<LoginForm initialMiembros={mockMiembros} />);
    const danielCard = screen.getByText('Daniel').closest('button');
    fireEvent.click(danielCard!);
    const switchPasswordBtn = screen.getByText('Prefiero ingresar con mi contraseña');
    fireEvent.click(switchPasswordBtn);
    expect(screen.getByPlaceholderText('Tu contraseña de acceso')).toBeInTheDocument();
  });

  it('submits traditional login and navigates on success', async () => {
    const { loginTradicional } = require('@/actions/auth');
    loginTradicional.mockResolvedValueOnce({ success: true, data: { id: 'user-1' } });

    render(<LoginForm initialMiembros={mockMiembros} />);
    fireEvent.click(screen.getByText('Ingresar con correo y contraseña'));

    fireEvent.change(screen.getByPlaceholderText('ejemplo@hogar.com'), { target: { value: 'daniel@hogar.com' } });
    fireEvent.change(screen.getByPlaceholderText('Tu contraseña'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByText('Iniciar Sesión'));

    await waitFor(() => {
      expect(loginTradicional).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('submits perfil password login and navigates on success', async () => {
    const { loginConCredenciales } = require('@/actions/auth');
    loginConCredenciales.mockResolvedValueOnce({ success: true, data: { id: 'user-1' } });

    render(<LoginForm initialMiembros={mockMiembros} />);
    fireEvent.click(screen.getByText('Daniel').closest('button')!);
    fireEvent.click(screen.getByText('Prefiero ingresar con mi contraseña'));

    fireEvent.change(screen.getByPlaceholderText('Tu contraseña de acceso'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByText('Entrar al Hogar'));

    await waitFor(() => {
      expect(loginConCredenciales).toHaveBeenCalledWith('user-1', 'secret', false);
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('displays error message when login fails', async () => {
    const { loginTradicional } = require('@/actions/auth');
    loginTradicional.mockResolvedValueOnce({ success: false, error: 'Credenciales inválidas' });

    render(<LoginForm initialMiembros={mockMiembros} />);
    fireEvent.click(screen.getByText('Ingresar con correo y contraseña'));

    fireEvent.change(screen.getByPlaceholderText('ejemplo@hogar.com'), { target: { value: 'bad@hogar.com' } });
    fireEvent.change(screen.getByPlaceholderText('Tu contraseña'), { target: { value: 'bad' } });
    fireEvent.click(screen.getByText('Iniciar Sesión'));

    await waitFor(() => {
      expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument();
    });
  });

  it('allows navigating directly to traditional view from PIN view', () => {
    render(<LoginForm initialMiembros={mockMiembros} />);
    fireEvent.click(screen.getByText('Daniel').closest('button')!);
    expect(screen.getByText('Ingresa tu PIN de 4 dígitos')).toBeInTheDocument();

    const switchTraditionalBtns = screen.getAllByText('Ingresar con correo y contraseña');
    fireEvent.click(switchTraditionalBtns[0]);
    expect(screen.getByPlaceholderText('ejemplo@hogar.com')).toBeInTheDocument();
  });

  it('allows navigating directly to traditional view from password view', () => {
    render(<LoginForm initialMiembros={mockMiembros} />);
    fireEvent.click(screen.getByText('Daniel').closest('button')!);
    fireEvent.click(screen.getByText('Prefiero ingresar con mi contraseña'));
    expect(screen.getByPlaceholderText('Tu contraseña de acceso')).toBeInTheDocument();

    const switchTraditionalBtns = screen.getAllByText('Ingresar con correo y contraseña');
    fireEvent.click(switchTraditionalBtns[0]);
    expect(screen.getByPlaceholderText('ejemplo@hogar.com')).toBeInTheDocument();
  });

  it('returns to member selection when clicking back from traditional view', () => {
    render(<LoginForm initialMiembros={mockMiembros} />);
    fireEvent.click(screen.getByText('Daniel').closest('button')!);
    const switchTraditionalBtns = screen.getAllByText('Ingresar con correo y contraseña');
    fireEvent.click(switchTraditionalBtns[0]);

    fireEvent.click(screen.getByText('← Volver a selección de miembros'));
    expect(screen.getByText('Daniel')).toBeInTheDocument();
    expect(screen.getByText('Pecas Macchi')).toBeInTheDocument();
  });
});
