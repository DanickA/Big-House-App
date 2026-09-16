import {
  crearEvento,
  actualizarEvento,
  cancelarEventoLogico,
  eliminarEventoFisico,
  EventoData,
} from '@/actions/calendario';
import { prisma } from '@/lib/prisma';
import { TipoPlantilla, EstadoEvento } from '@prisma/client';

// Mockeamos prisma y next/cache
jest.mock('@/lib/prisma', () => ({
  prisma: {
    eventos: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    subtareas_evento: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    recordatorios_evento: {
      updateMany: jest.fn(),
    },
  },
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

describe('Calendario Actions', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Validaciones Generales y RF-02 por Plantilla', () => {
    it('debe lanzar error si fecha_fin es anterior a fecha_inicio', async () => {
      const data: EventoData = {
        titulo: 'Test',
        tipo_plantilla: TipoPlantilla.EVENTO,
        fecha_inicio: new Date('2026-10-10T15:00:00'),
        fecha_fin: new Date('2026-10-10T14:00:00'),
        todo_el_dia: false,
        color: '#ff0000',
        creador_id: 'uuid-1',
      };

      const res = await crearEvento(data);
      expect(res.success).toBe(false);
      expect(res.error).toBe('La fecha de fin debe ser posterior a la de inicio');
    });

    it('debe normalizar fechas si es todo_el_dia', async () => {
      const data: EventoData = {
        titulo: 'Cumpleaños de Papá',
        tipo_plantilla: TipoPlantilla.CUMPLEANOS,
        fecha_inicio: new Date('2026-10-10T15:30:00'),
        fecha_fin: new Date('2026-10-10T16:30:00'),
        todo_el_dia: true,
        color: '#ff0000',
        creador_id: 'uuid-1',
      };

      (prisma.eventos.create as jest.Mock).mockResolvedValue({ id: 'evento-1' });

      const res = await crearEvento(data);
      expect(res.success).toBe(true);

      const createArgs = (prisma.eventos.create as jest.Mock).mock.calls[0][0].data;
      expect(createArgs.fecha_inicio.getHours()).toBe(0);
      expect(createArgs.fecha_fin.getHours()).toBe(23);
      expect(createArgs.fecha_fin.getMinutes()).toBe(59);
    });

    it('Plantilla Cita Médica: debe rechazar modalidad todo el día', async () => {
      const data: EventoData = {
        titulo: 'Cita Médica',
        tipo_plantilla: TipoPlantilla.CITA_MEDICA,
        fecha_inicio: new Date('2026-10-10T10:00:00'),
        fecha_fin: new Date('2026-10-10T11:00:00'),
        todo_el_dia: true, // No permitido
        ubicacion: 'Consultorio 101',
        participantes_ids: ['paciente-uuid'],
        color: '#0284C7',
        creador_id: 'uuid-1',
      };

      const res = await crearEvento(data);
      expect(res.success).toBe(false);
      expect(res.error).toContain('no admite modalidad todo el día');
    });

    it('Plantilla Cita Médica: debe exigir ubicación obligatoria', async () => {
      const data: EventoData = {
        titulo: 'Cita Médica',
        tipo_plantilla: TipoPlantilla.CITA_MEDICA,
        fecha_inicio: new Date('2026-10-10T10:00:00'),
        fecha_fin: new Date('2026-10-10T11:00:00'),
        todo_el_dia: false,
        ubicacion: '', // Vacía
        participantes_ids: ['paciente-uuid'],
        color: '#0284C7',
        creador_id: 'uuid-1',
      };

      const res = await crearEvento(data);
      expect(res.success).toBe(false);
      expect(res.error).toContain('La ubicación es obligatoria');
    });

    it('Plantilla Cita Médica: debe exigir paciente del hogar obligatorio', async () => {
      const data: EventoData = {
        titulo: 'Cita Médica',
        tipo_plantilla: TipoPlantilla.CITA_MEDICA,
        fecha_inicio: new Date('2026-10-10T10:00:00'),
        fecha_fin: new Date('2026-10-10T11:00:00'),
        todo_el_dia: false,
        ubicacion: 'Clínica San Lucas',
        participantes_ids: [], // Sin paciente
        color: '#0284C7',
        creador_id: 'uuid-1',
      };

      const res = await crearEvento(data);
      expect(res.success).toBe(false);
      expect(res.error).toContain('Debe seleccionar obligatoriamente un paciente');
    });

    it('Plantilla Tarea: debe exigir un responsable asignado', async () => {
      const data: EventoData = {
        titulo: 'Lavar ventanas',
        tipo_plantilla: TipoPlantilla.TAREA,
        fecha_inicio: new Date('2026-10-10T10:00:00'),
        fecha_fin: new Date('2026-10-10T11:00:00'),
        todo_el_dia: false,
        participantes_ids: [], // Sin responsable
        color: '#D97706',
        creador_id: 'uuid-1',
      };

      const res = await crearEvento(data);
      expect(res.success).toBe(false);
      expect(res.error).toContain('responsable asignado');
    });

    it('Plantilla Cumpleaños: debe agregar el agasajado externo a la tabla participantes_externos', async () => {
      const data: EventoData = {
        titulo: 'Cumpleaños de Tío Carlos',
        tipo_plantilla: TipoPlantilla.CUMPLEANOS,
        fecha_inicio: new Date('2026-10-10T00:00:00'),
        fecha_fin: new Date('2026-10-10T23:59:59'),
        todo_el_dia: true,
        color: '#7C3AED',
        creador_id: 'uuid-1',
        detalles: {
          agasajado_tipo: 'externo',
          agasajado_externo: 'Tío Carlos',
          contacto_externo: '3001234567'
        }
      };

      (prisma.eventos.create as jest.Mock).mockResolvedValue({ id: 'evento-cumple' });

      const res = await crearEvento(data);
      expect(res.success).toBe(true);

      const createArgs = (prisma.eventos.create as jest.Mock).mock.calls[0][0].data;
      expect(createArgs.externos.create).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ nombre: 'Tío Carlos', contacto: '3001234567' })
        ])
      );
    });
  });

  describe('RN-01 y RF-03: Edición, Cancelación y Eliminación de Eventos', () => {
    it('debe permitir cancelar un evento (Baja lógica - CANCELADO) y desactivar recordatorios', async () => {
      (prisma.eventos.update as jest.Mock).mockResolvedValue({ id: 'evento-1', estado: EstadoEvento.CANCELADO });
      (prisma.recordatorios_evento.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      const res = await cancelarEventoLogico('evento-1');
      
      expect(res.success).toBe(true);
      expect(prisma.eventos.update).toHaveBeenCalledWith({
        where: { id: 'evento-1' },
        data: { estado: EstadoEvento.CANCELADO }
      });
      expect(prisma.recordatorios_evento.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { evento_id: 'evento-1', enviado: false }
      }));
    });

    it('debe permitir eliminar definitivamente un evento (Baja física)', async () => {
      (prisma.eventos.delete as jest.Mock).mockResolvedValue({ id: 'evento-1' });

      const res = await eliminarEventoFisico('evento-1');

      expect(res.success).toBe(true);
      expect(prisma.eventos.delete).toHaveBeenCalledWith({
        where: { id: 'evento-1' }
      });
    });

    it('debe modificar directamente un evento sin recurrencia', async () => {
      (prisma.eventos.findUnique as jest.Mock).mockResolvedValue({
        id: 'evento-1',
        titulo: 'Título anterior',
        recurrencia: null,
        participantes: [],
        externos: [],
        subtareas: [],
        fecha_inicio: new Date('2026-10-10T10:00:00'),
        fecha_fin: new Date('2026-10-10T11:00:00'),
        todo_el_dia: false,
        color: '#2563EB',
      });

      (prisma.eventos.update as jest.Mock).mockResolvedValue({
        id: 'evento-1',
        titulo: 'Título actualizado',
      });

      const res = await actualizarEvento('evento-1', {
        titulo: 'Título actualizado',
        color: '#7C3AED',
      }, 'SIN_RECURRENCIA');

      expect(res.success).toBe(true);
      expect(prisma.eventos.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'evento-1' },
        data: expect.objectContaining({
          titulo: 'Título actualizado',
          color: '#7C3AED',
        })
      }));
    });

    it('RF-03 Recurrencia: "Modificar solo este evento" debe desvincular la fecha y crear una instancia independiente sin recurrencia', async () => {
      const fechaOriginal = new Date('2026-10-10T00:00:00');
      (prisma.eventos.findUnique as jest.Mock).mockResolvedValue({
        id: 'evento-anual-1',
        titulo: 'Cumpleaños Anual',
        recurrencia: 'ANUAL',
        participantes: [{ id: 'user-1' }],
        externos: [],
        subtareas: [],
        fecha_inicio: fechaOriginal,
        fecha_fin: new Date('2026-10-10T23:59:59'),
        todo_el_dia: true,
        color: '#7C3AED',
        creador_id: 'user-1',
      });

      (prisma.eventos.create as jest.Mock).mockResolvedValue({
        id: 'evento-desvinculado-2',
        titulo: 'Cumpleaños Especial (Solo Este)',
        recurrencia: null,
      });

      (prisma.eventos.update as jest.Mock).mockResolvedValue({
        id: 'evento-anual-1',
      });

      const res = await actualizarEvento('evento-anual-1', {
        titulo: 'Cumpleaños Especial (Solo Este)',
        color: '#D97706',
      }, 'SOLO_ESTE');

      expect(res.success).toBe(true);
      // Debe crear el nuevo evento con recurrencia: null
      expect(prisma.eventos.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          titulo: 'Cumpleaños Especial (Solo Este)',
          color: '#D97706',
          recurrencia: null,
        })
      }));
      // Debe actualizar la serie original para adelantarla al siguiente ciclo y no duplicar
      expect(prisma.eventos.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'evento-anual-1' }
      }));
    });

    it('RF-03 Recurrencia: "Modificar este y futuros" debe actualizar la serie original y su recurrencia', async () => {
      (prisma.eventos.findUnique as jest.Mock).mockResolvedValue({
        id: 'evento-anual-1',
        titulo: 'Cumpleaños Anual',
        recurrencia: 'ANUAL',
        participantes: [],
        externos: [],
        subtareas: [],
        fecha_inicio: new Date('2026-10-10T00:00:00'),
        fecha_fin: new Date('2026-10-10T23:59:59'),
        todo_el_dia: true,
        color: '#7C3AED',
      });

      (prisma.eventos.update as jest.Mock).mockResolvedValue({
        id: 'evento-anual-1',
        titulo: 'Nuevo Nombre Cumpleaños',
      });

      const res = await actualizarEvento('evento-anual-1', {
        titulo: 'Nuevo Nombre Cumpleaños',
      }, 'ESTE_Y_FUTUROS');

      expect(res.success).toBe(true);
      expect(prisma.eventos.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'evento-anual-1' },
        data: expect.objectContaining({
          titulo: 'Nuevo Nombre Cumpleaños',
        })
      }));
    });
  });
});
