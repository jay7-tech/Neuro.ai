import bcrypt from 'bcryptjs';

const COST = Number(process.env.BCRYPT_COST ?? 11);

/**
 * A real hash of a random string, compared against when the email does not exist.
 * Keeps login latency the same for known and unknown emails (no user enumeration by timing).
 */
const DUMMY_HASH = bcrypt.hashSync('neuro-ai-timing-equaliser', COST);

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export async function verifyPassword(plain: string, hash: string | null | undefined): Promise<boolean> {
  const ok = await bcrypt.compare(plain, hash ?? DUMMY_HASH);
  return hash ? ok : false;
}
