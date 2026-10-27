import {
  LoginConCredencialesUseCase,
  RegistroNuevoMiembroUseCase,
  CreateHabitanteUseCase,
  UpdateHabitanteUseCase,
  DeleteHabitanteUseCase,
  IHabitanteRepository,
  IPasswordHasher,
  ISessionService,
  SessionPayload,
  Habitante,
  CreateHabitanteData,
  UpdateHabitanteData,
  HabitanteSelectorItem,
  HabitanteListItem,
} from '@/modules/habitantes';

class InMemoryHabitanteRepository implements IHabitanteRepository {
  private habitantes: Map<string, Habitante> = new Map();

  async findById(id: string): Promise<Habitante | null> {
    return this.habitantes.get(id) || null;
  }

  async findByEmail(email: string): Promise<Habitante | null> {
    for (const h of this.habitantes.values()) {
      if (h.email.toLowerCase() === email.toLowerCase()) return h;
    }
    return null;
  }

  async findAll(): Promise<Habitante[]> {
    return Array.from(this.habitantes.values());
  }

  async count(): Promise<number> {
    return this.habitantes.size;
  }

  async findForSelector(): Promise<HabitanteSelectorItem[]> {
    return Array.from(this.habitantes.values()).map((h) => ({
      id: h.id,
      nombre: h.nombre,
      tienePin: !!h.pin_hash,
      pinLongitud: h.pin_longitud || 4,
    }));
  }

  async findAllWithDetails(): Promise<HabitanteListItem[]> {
    return Array.from(this.habitantes.values()).map((h) => ({
      id: h.id,
      nombre: h.nombre,
      email: h.email,
      rol: h.rol || 'MIEMBRO',
      activo: h.activo ?? true,
      tienePin: !!h.pin_hash,
      pinLongitud: h.pin_longitud || 4,
      fecha_registro: h.fecha_registro,
    }));
  }

  async create(data: CreateHabitanteData): Promise<Habitante> {
    const id = `hab-${Date.now()}-${Math.random()}`;
    const habitante: Habitante = {
      id,
      nombre: data.nombre,
      email: data.email,
      password_hash: data.password_hash,
      pin_hash: data.pin_hash ?? null,
      pin_longitud: data.pin_longitud ?? null,
      rol: data.rol ?? 'ADMIN',
      token_version: data.token_version ?? 1,
      activo: data.activo ?? true,
      fecha_registro: new Date(),
    };
    this.habitantes.set(id, habitante);
    return habitante;
  }

  async update(id: string, data: UpdateHabitanteData): Promise<Habitante> {
    const existing = this.habitantes.get(id);
    if (!existing) throw new Error('Habitante no encontrado');
    const updated: Habitante = {
      ...existing,
      nombre: data.nombre ?? existing.nombre,
      email: data.email ?? existing.email,
      password_hash: data.password_hash ?? existing.password_hash,
      pin_hash: data.pin_hash !== undefined ? data.pin_hash : existing.pin_hash,
      pin_longitud: data.pin_longitud !== undefined ? data.pin_longitud : existing.pin_longitud,
      rol: data.rol ?? existing.rol,
      activo: data.activo !== undefined ? data.activo : existing.activo,
      token_version: data.incrementTokenVersion
        ? existing.token_version + 1
        : data.token_version ?? existing.token_version,
    };
    this.habitantes.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.habitantes.delete(id);
  }
}

class MockPasswordHasher implements IPasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hashed_${plain}`;
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return hashed === `hashed_${plain}` || hashed === plain;
  }
}

class MockSessionService implements ISessionService {
  public currentSession: SessionPayload | null = null;

  async createSession(
    userId: string,
    nombre: string,
    email: string,
    rol?: 'ADMIN' | 'MIEMBRO',
    tokenVersion?: number
  ): Promise<void> {
    this.currentSession = { userId, nombre, email, rol, tokenVersion };
  }

  async getSession(): Promise<SessionPayload | null> {
    return this.currentSession;
  }

  async destroySession(): Promise<void> {
    this.currentSession = null;
  }
}

describe('Habitantes Module - Clean Architecture Use Cases', () => {
  let repo: InMemoryHabitanteRepository;
  let hasher: MockPasswordHasher;
  let sessionService: MockSessionService;

  beforeEach(() => {
    repo = new InMemoryHabitanteRepository();
    hasher = new MockPasswordHasher();
    sessionService = new MockSessionService();
  });

  describe('Registro y Login', () => {
    it('debe registrar al primer habitante como ADMIN e iniciar sesión automáticamente', async () => {
      const useCase = new RegistroNuevoMiembroUseCase(repo, hasher, sessionService);
      const res = await useCase.execute({
        nombre: 'Ana',
        email: 'ana@hogar.com',
        password: 'passwordSeguro',
        pin: '1234',
      });

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.nombre).toBe('Ana');
        expect(res.data.email).toBe('ana@hogar.com');
        expect(res.data.rol).toBe('ADMIN');
      }
      expect(sessionService.currentSession?.email).toBe('ana@hogar.com');
      expect(sessionService.currentSession?.rol).toBe('ADMIN');
    });

    it('debe rechazar registro público cuando ya existe un habitante (solo admin invita)', async () => {
      const useCase = new RegistroNuevoMiembroUseCase(repo, hasher, sessionService);
      await useCase.execute({
        nombre: 'Ana',
        email: 'ana@hogar.com',
        password: 'passwordSeguro',
      });

      const resDuplicado = await useCase.execute({
        nombre: 'Ana 2',
        email: 'ana2@hogar.com',
        password: 'otraPasswordSegura',
      });

      expect(resDuplicado.success).toBe(false);
      if (!resDuplicado.success) {
        expect(resDuplicado.error.code).toBe('UNAUTHORIZED');
      }
    });

    it('debe autenticar con PIN correctamente', async () => {
      const regUseCase = new RegistroNuevoMiembroUseCase(repo, hasher, sessionService);
      const regRes = await regUseCase.execute({
        nombre: 'Pedro',
        email: 'pedro@hogar.com',
        password: 'passwordPedro',
        pin: '5678',
      });
      expect(regRes.success).toBe(true);
      const usuarioId = regRes.data?.id!;

      const loginUseCase = new LoginConCredencialesUseCase(repo, hasher, sessionService);
      const loginRes = await loginUseCase.execute({
        usuarioId,
        credential: '5678',
        usarPin: true,
      });

      expect(loginRes.success).toBe(true);
      if (loginRes.success) {
        expect(loginRes.data.nombre).toBe('Pedro');
      }
    });

    it('debe rechazar autenticación con PIN incorrecto', async () => {
      const regUseCase = new RegistroNuevoMiembroUseCase(repo, hasher, sessionService);
      const regRes = await regUseCase.execute({
        nombre: 'Pedro',
        email: 'pedro@hogar.com',
        password: 'passwordPedro',
        pin: '5678',
      });
      const usuarioId = regRes.data?.id!;

      const loginUseCase = new LoginConCredencialesUseCase(repo, hasher, sessionService);
      const loginRes = await loginUseCase.execute({
        usuarioId,
        credential: '9999',
        usarPin: true,
      });

      expect(loginRes.success).toBe(false);
      if (!loginRes.success) {
        expect(loginRes.error.code).toBe('UNAUTHORIZED');
      }
    });
  });

  describe('CRUD de Habitantes', () => {
    it('debe impedir que un habitante elimine su propia cuenta activa', async () => {
      const habitante = await repo.create({
        nombre: 'Admin',
        email: 'admin@hogar.com',
        password_hash: 'hashed',
      });

      const deleteUseCase = new DeleteHabitanteUseCase(repo);
      const res = await deleteUseCase.execute({
        id: habitante.id,
        currentUserId: habitante.id,
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('FORBIDDEN');
        expect(res.error.message).toContain('propia cuenta');
      }
    });

    it('debe revocar el PIN cuando se actualiza el método a solo contraseña (pin="")', async () => {
      const habitante = await repo.create({
        nombre: 'Usuario Con Pin',
        email: 'conpin@hogar.com',
        password_hash: 'hashed',
        pin_hash: 'hashed-pin',
        pin_longitud: 4,
      });

      const updateUseCase = new UpdateHabitanteUseCase(repo, hasher);
      const res = await updateUseCase.execute({
        id: habitante.id,
        nombre: 'Usuario Sin Pin',
        email: 'conpin@hogar.com',
        password: 'new-password-segura',
        pin: '',
      });

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.pin_hash).toBeNull();
        expect(res.data.pin_longitud).toBeNull();
      }
    });
  });
});
