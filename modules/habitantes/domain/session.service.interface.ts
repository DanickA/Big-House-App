export interface SessionPayload {
  userId: string;
  nombre: string;
  email: string;
}

export interface ISessionService {
  createSession(userId: string, nombre: string, email: string): Promise<void>;
  getSession(): Promise<SessionPayload | null>;
  destroySession(): Promise<void>;
}
