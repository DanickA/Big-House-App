import { prisma } from '@/lib/prisma';
import {
  IHabitanteRepository,
  CreateHabitanteData,
  UpdateHabitanteData,
} from '../domain/habitante.repository.interface';
import { Habitante, HabitanteSelectorItem, HabitanteListItem } from '../domain/habitante.entity';

export class PrismaHabitanteRepository implements IHabitanteRepository {
  constructor(private readonly db = prisma) {}

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
      fecha_registro: u.fecha_registro,
    }));
  }

  async findForSelector(): Promise<HabitanteSelectorItem[]> {
    let usuarios: any[];
    try {
      usuarios = await this.db.usuarios.findMany({
        select: {
          id: true,
          nombre: true,
          email: true,
          pin_hash: true,
          pin_longitud: true,
        },
        orderBy: {
          nombre: 'asc',
        },
      });
    } catch (queryErr: any) {
      if (queryErr?.message?.includes('pin_longitud')) {
        const fallbackUsuarios = await this.db.usuarios.findMany({
          select: {
            id: true,
            nombre: true,
            email: true,
            pin_hash: true,
          },
          orderBy: {
            nombre: 'asc',
          },
        });
        usuarios = fallbackUsuarios.map((u) => ({ ...u, pin_longitud: 4 }));
      } else {
        throw queryErr;
      }
    }

    return usuarios.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      tienePin: !!u.pin_hash,
      pinLongitud: u.pin_longitud || 4,
    }));
  }

  async findAllWithDetails(): Promise<HabitanteListItem[]> {
    let usuarios: any[];
    try {
      usuarios = await this.db.usuarios.findMany({
        select: {
          id: true,
          nombre: true,
          email: true,
          pin_hash: true,
          pin_longitud: true,
          fecha_registro: true,
        },
        orderBy: {
          fecha_registro: 'desc',
        },
      });
    } catch (queryErr: any) {
      if (queryErr?.message?.includes('pin_longitud')) {
        const fallback = await this.db.usuarios.findMany({
          select: {
            id: true,
            nombre: true,
            email: true,
            pin_hash: true,
            fecha_registro: true,
          },
          orderBy: {
            fecha_registro: 'desc',
          },
        });
        usuarios = fallback.map((u) => ({ ...u, pin_longitud: 4 }));
      } else {
        throw queryErr;
      }
    }

    return usuarios.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      email: u.email,
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
      },
    });

    return {
      id: created.id,
      nombre: created.nombre,
      email: created.email,
      password_hash: created.password_hash,
      pin_hash: created.pin_hash,
      pin_longitud: created.pin_longitud,
      fecha_registro: created.fecha_registro,
    };
  }

  async update(id: string, data: UpdateHabitanteData): Promise<Habitante> {
    const dataToUpdate: any = {};
    if (data.nombre !== undefined) dataToUpdate.nombre = data.nombre;
    if (data.email !== undefined) dataToUpdate.email = data.email;
    if (data.password_hash !== undefined) dataToUpdate.password_hash = data.password_hash;
    if (data.pin_hash !== undefined) dataToUpdate.pin_hash = data.pin_hash;
    if (data.pin_longitud !== undefined) dataToUpdate.pin_longitud = data.pin_longitud;

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
      fecha_registro: updated.fecha_registro,
    };
  }

  async delete(id: string): Promise<void> {
    await this.db.usuarios.delete({
      where: { id },
    });
  }
}

export const defaultHabitanteRepository = new PrismaHabitanteRepository();
