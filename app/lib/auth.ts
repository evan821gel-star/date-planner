import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';

const SESSION_COOKIE = 'session_id';
const SESSION_DAYS = 30;

function hashPassword(password: string, salt: string) {
  return crypto.pbkdf2Sync(password, salt, 100_000, 32, 'sha256').toString('hex');
}

export function createPasswordHash(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(password, salt);
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, hash: string) {
  const hashed = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hashed, 'hex'), Buffer.from(hash, 'hex'));
}

export async function createSession(userId: number) {
  const id = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: {
      id,
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/',
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => undefined);
    cookieStore.delete(SESSION_COOKIE);
  }
}

export async function requireUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) {
    return { error: new Response('unauthorized', { status: 401 }) };
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: sessionId } }).catch(() => undefined);
    }
    cookieStore.delete(SESSION_COOKIE);
    return { error: new Response('unauthorized', { status: 401 }) };
  }

  return { userId: session.userId };
}
