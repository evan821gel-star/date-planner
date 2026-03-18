import { prisma } from '@/app/lib/prisma';
import { requireUser } from '@/app/lib/auth';
import type { Prisma } from '@prisma/client';

export async function GET() {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const membership = await prisma.pairMember.findFirst({
    where: { userId: auth.userId },
  });
  if (!membership) {
    return new Response('pair not found', { status: 404 });
  }

  const users = await prisma.user.findMany({
    where: {
      memberships: {
        some: { pairId: membership.pairId },
      },
    },
    orderBy: { id: 'asc' },
  });

  return Response.json(users);
}

export async function PATCH(req: Request) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const body = await req.json();
  const { name } = body;

  if (!name || typeof name !== 'string') {
    return new Response('name is required', { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: auth.userId },
    data: { name: name.trim() },
  });

  return Response.json(updated);
}
