export interface SessionPayload {
  userId: string;
  nombre: string;
  email: string;
  rol?: 'ADMIN' | 'MIEMBRO';
  tokenVersion?: number;
}

export interface ISessionService {
  createSession(
    userId: string,
    nombre: string,
    email: string,
    rol?: 'ADMIN' | 'MIEMBRO',
    tokenVersion?: number
  ): Promise<void>;
  getSession(): Promise<SessionPayload | null>;
  destroySession(): Promise<void>;
}
