import { IAporteFondoRepository } from '../../domain/aporte-fondo.repository.interface';
import { ResumenFondoComunMes, ResumenHabitanteFondo } from '../../domain/aporte-fondo.entity';
import { Result, ok, err, AppError, ValidationError, UnexpectedError } from '@/modules/shared';
import { defaultAporteFondoRepository } from '../../infrastructure/prisma-aporte-fondo.repository';

export class GetFondoComunMesUseCase {
  constructor(private readonly repo: IAporteFondoRepository = defaultAporteFondoRepository) {}

  async execute(periodoMes?: string): Promise<Result<ResumenFondoComunMes, AppError>> {
    try {
      const now = new Date();
      let year = now.getFullYear();
      let month = now.getMonth() + 1;

      if (periodoMes) {
        if (!/^\d{4}-\d{2}$/.test(periodoMes)) {
          return err(new ValidationError('Formato de mes inválido. Usa YYYY-MM'));
        }
        const [y, m] = periodoMes.split('-').map(Number);
        if (m < 1 || m > 12) {
          return err(new ValidationError('Mes fuera de rango (01-12)'));
        }
        year = y;
        month = m;
      }

      const mesFormateado = `${year}-${String(month).padStart(2, '0')}`;
      const aportes = await this.repo.findByMonth(year, month);

      const presupuestoMesRecaudado = aportes.reduce((acc, item) => acc + item.monto, 0);

      const mapaPorHabitante = new Map<string, ResumenHabitanteFondo>();
      for (const ap of aportes) {
        const current = mapaPorHabitante.get(ap.usuario_id);
        const nombre = ap.usuario?.nombre || 'Habitante';
        if (!current) {
          mapaPorHabitante.set(ap.usuario_id, {
            usuario_id: ap.usuario_id,
            nombre,
            totalAportado: ap.monto,
            cantidadAportes: 1,
            ultimoAporte: ap,
          });
        } else {
          current.totalAportado += ap.monto;
          current.cantidadAportes += 1;
          // Como vienen ordenados por fecha descendente, el primero es el más reciente
          if (!current.ultimoAporte) {
            current.ultimoAporte = ap;
          }
        }
      }

      return ok({
        periodoMes: mesFormateado,
        presupuestoMesRecaudado: Math.round(presupuestoMesRecaudado * 100) / 100,
        aportes,
        porHabitante: Array.from(mapaPorHabitante.values()),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error inesperado';
      return err(new UnexpectedError('No se pudo obtener el Fondo Común del mes', { original: message }));
    }
  }
}
