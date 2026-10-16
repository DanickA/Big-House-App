import bcrypt from 'bcryptjs';
import { IPasswordHasher } from '../domain/password-hasher.service.interface';

export class BcryptPasswordHasher implements IPasswordHasher {
  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, 10);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plain, hashed);
    } catch {
      return false;
    }
  }
}

export const defaultPasswordHasher = new BcryptPasswordHasher();
