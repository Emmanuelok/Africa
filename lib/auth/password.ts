import bcrypt from "bcryptjs";

const ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  if (!plain || !hashed) return false;
  try {
    return await bcrypt.compare(plain, hashed);
  } catch {
    return false;
  }
}

// Constant-time string compare to dodge timing leaks on demo path.
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}
