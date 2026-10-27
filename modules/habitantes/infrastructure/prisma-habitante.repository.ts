import { prisma, PrismaDbClient } from '@/lib/prisma';
import {
  IHabitanteRepository,
  CreateHabitanteData,
  UpdateHabitanteData,
} from '../domain/habitante.repository.interface';
import { Habitante, HabitanteSelectorItem, HabitanteListItem, RolUsuario } from '../domain/habitante.entity';

export class PrismaHabitanteRepository implements IHabitanteRepository {
  constructor(private readonly db: PrismaDbClient = prisma) {}

  async findById(id: string): Promise<Habitante | null> {
    const u = await this.db.usuarios.findUnique({
      where: { id },
    });
    if (!u) return null;
    return {
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      password_hash: u.password_hash,
      pin_hash: u.pin_hash,
      pin_longitud: u.pin_longitud,
      rol: (u.rol as RolUsuario) || 'MIEMBRO',
      token_version: u.token_version ?? 1,
      activo: u.activo ?? true,
      fecha_registro: u.fecha_registro,
    };
  }

  async findByEmail(email: string): Promise<Habitante | null> {
    const u = await this.db.usuarios.findUnique({
      where: { email },
    });
    if (!u) return null;
    return {
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      password_hash: u.password_hash,
      pin_hash: u.pin_hash,
      pin_longitud: u.pin_longitud,
      rol: (u.rol as RolUsuario) || 'MIEMBRO',
      token_version: u.token_version ?? 1,
      activo: u.activo ?? true,
      fecha_registro: u.fecha_registro,
    };
  }

  async findAll(): Promise<Habitante[]> {
    const list = await this.db.usuarios.findMany({
      orderBy: { nombre: 'asc' },
    });
    return list.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      password_hash: u.password_hash,
      pin_hash: u.pin_hash,
      pin_longitud: u.pin_longitud,
      rol: (u.rol as RolUsuario) || 'MIEMBRO',
      token_version: u.token_version ?? 1,
      activo: u.activo ?? true,
      fecha_registro: u.fecha_registro,
    }));
  }

  async count(): Promise<number> {
    return await this.db.usuarios.count();
  }

  async findForSelector(): Promise<HabitanteSelectorItem[]> {
    const usuarios = await this.db.usuarios.findMany({
      where: {
        activo: true,
      },
      select: {
        id: true,
        nombre: true,
        pin_hash: true,
        pin_longitud: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    return usuarios.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      tienePin: !!u.pin_hash,
      pinLongitud: u.pin_longitud || 4,
    }));
  }

  async findAllWithDetails(): Promise<HabitanteListItem[]> {
    const usuarios = await this.db.usuarios.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        pin_hash: true,
        pin_longitud: true,
        rol: true,
        activo: true,
        fecha_registro: true,
      },
      orderBy: {
        fecha_registro: 'desc',
      },
    });

    return usuarios.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      rol: (u.rol as RolUsuario) || 'MIEMBRO',
      activo: u.activo ?? true,
      tienePin: !!u.pin_hash,
      pinLongitud: u.pin_longitud || 4,
      fecha_registro: u.fecha_registro,
    }));
  }

  async create(data: CreateHabitanteData): Promise<Habitante> {
    const created = await this.db.usuarios.create({
      data: {
        nombre: data.nombre,
        email: data.email,
        password_hash: data.password_hash,
        pin_hash: data.pin_hash ?? null,
        pin_longitud: data.pin_longitud ?? null,
        rol: data.rol ?? 'MIEMBRO',
        token_version: data.token_version ?? 1,
        activo: data.activo ?? true,
      },
    });

    return {
      id: created.id,
      nombre: created.nombre,
      email: created.email,
      password_hash: created.password_hash,
      pin_hash: created.pin_hash,
      pin_longitud: created.pin_longitud,
      rol: (created.rol as RolUsuario) || 'MIEMBRO',
      token_version: created.token_version ?? 1,
      activo: created.activo ?? true,
      fecha_registro: created.fecha_registro,
    };
  }

  async update(id: string, data: UpdateHabitanteData): Promise<Habitante> {
    const dataToUpdate: Record<string, unknown> = {};
    if (data.nombre !== undefined) dataToUpdate.nombre = data.nombre;
    if (data.email !== undefined) dataToUpdate.email = data.email;
    if (data.password_hash !== undefined) dataToUpdate.password_hash = data.password_hash;
    if (data.pin_hash !== undefined) dataToUpdate.pin_hash = data.pin_hash;
    if (data.pin_longitud !== undefined) dataToUpdate.pin_longitud = data.pin_longitud;
    if (data.rol !== undefined) dataToUpdate.rol = data.rol;
    if (data.activo !== undefined) dataToUpdate.activo = data.activo;
    if (data.incrementTokenVersion) {
      dataToUpdate.token_version = { increment: 1 };
    } else if (data.token_version !== undefined) {
      dataToUpdate.token_version = data.token_version;
    }

    const updated = await this.db.usuarios.update({
      where: { id },
      data: dataToUpdate,
    });

    return {
      id: updated.id,
      nombre: updated.nombre,
      email: updated.email,
      password_hash: updated.password_hash,
      pin_hash: updated.pin_hash,
      pin_longitud: updated.pin_longitud,
      rol: (updated.rol as RolUsuario) || 'MIEMBRO',
      token_version: updated.token_version ?? 1,
      activo: updated.activo ?? true,
      fecha_registro: updated.fecha_registro,
    };
  }

  async delete(id: string): Promise<void> {
    const [pagosCount, ingresosCount, gastosCount] = await Promise.all([
      typeof this.db.pagos_servicios?.count === 'function'
        ? this.db.pagos_servicios.count({ where: { usuario_id: id } })
        : 0,
      typeof this.db.ingresos?.count === 'function'
        ? this.db.ingresos.count({ where: { usuario_id: id } })
        : 0,
      typeof this.db.gastos?.count === 'function'
        ? this.db.gastos.count({ where: { usuario_id: id } })
        : 0,
    ]);

    if (pagosCount + ingresosCount + gastosCount > 0) {
      // Baja lógica para preservar el historial contable de pagos, ingresos y gastos (F-14)
      await this.db.usuarios.update({
        where: { id },
        data: {
          activo: false,
          token_version: { increment: 1 },
        },
      });
      return;
    }

    await this.db.usuarios.delete({
      where: { id },
    });
  }
}

export const defaultHabitanteRepository = new PrismaHabitanteRepository();
