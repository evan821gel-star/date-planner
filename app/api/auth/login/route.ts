import { prisma } from '@/app/lib/prisma';
import { createSession, verifyPassword } from '@/app/lib/auth';

export async function POST(req: Request) {
  const body = await req.json();
  const { username, password } = body;

  if (!username || typeof username !== 'string') {
    return new Response('username is required', { status: 400 });
  }
  if (!password || typeof password !== 'string') {
    return new Response('password is required', { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.passwordHash || !user.passwordSalt) {
    return new Response('invalid credentials', { status: 401 });
  }

  const ok = verifyPassword(password, user.passwordSalt, user.passwordHash);
  if (!ok) {
    return new Response('invalid credentials', { status: 401 });
  }

  await createSession(user.id);
  return Response.json({ id: user.id, name: user.name });
}
