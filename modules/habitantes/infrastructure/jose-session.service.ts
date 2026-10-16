import { ISessionService, SessionPayload } from '../domain/session.service.interface';
import { createSession, getSession, destroySession } from '@/lib/session';

export class JoseSessionService implements ISessionService {
  async createSession(userId: string, nombre: string, email: string): Promise<void> {
    await createSession(userId, nombre, email);
  }

  async getSession(): Promise<SessionPayload | null> {
    const session = await getSession();
    if (!session) return null;
    return {
      userId: session.userId,
      nombre: session.nombre,
      email: session.email,
    };
  }

  async destroySession(): Promise<void> {
    await destroySession();
  }
}

export const defaultSessionService = new JoseSessionService();
