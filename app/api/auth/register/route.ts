import { prisma } from '@/app/lib/prisma';
import { createPasswordHash, createSession } from '@/app/lib/auth';

export async function POST(req: Request) {
  const body = await req.json();
  const { username, password, name } = body;

  if (!username || typeof username !== 'string') {
    return new Response('username is required', { status: 400 });
  }
  if (!password || typeof password !== 'string') {
    return new Response('password is required', { status: 400 });
  }

  const exists = await prisma.user.findUnique({
    where: { username },
  });
  if (exists) {
    return new Response('username already exists', { status: 409 });
  }

  const { salt, hash } = createPasswordHash(password);

  const pair = (await prisma.pair.findFirst()) ?? (await prisma.pair.create({ data: {} }));
  const user = await prisma.user.create({
    data: {
      username,
      passwordHash: hash,
      passwordSalt: salt,
      name: typeof name === 'string' && name.trim() !== '' ? name.trim() : username,
    },
  });

  await prisma.pairMember.create({
    data: { pairId: pair.id, userId: user.id },
  });

  await createSession(user.id);

  return Response.json({ id: user.id, name: user.name });
}
