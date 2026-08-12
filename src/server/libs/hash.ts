import bcrypt from 'bcryptjs';

export function hashSecret(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export function compareSecret(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}
