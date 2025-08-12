import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function generateToken(length = 48): string {
  return randomBytes(length).toString("hex");
}


