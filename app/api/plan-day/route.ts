import { prisma } from '@/app/lib/prisma';

async function getContext(req: Request) {
  const userIdHeader = req.headers.get('x-user-id');
  const userId = userIdHeader ? Number(userIdHeader) : NaN;
  if (!userId || Number.isNaN(userId)) {
    return { error: new Response('user is required', { status: 401 }) };
  }
  const membership = await prisma.pairMember.findFirst({
    where: { userId },
  });
  if (!membership) {
    return { error: new Response('pair not found', { status: 404 }) };
  }
  return { userId, pairId: membership.pairId };
}

export async function GET(req: Request) {
  const ctx = await getContext(req);
  if ('error' in ctx) return ctx.error;

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get('date');

  if (!dateStr) {
    return new Response('date is required', { status: 400 });
  }

  const start = new Date(`${dateStr}T00:00:00.000Z`);
  const end = new Date(`${dateStr}T23:59:59.999Z`);

  const planDay = await prisma.planDay.findFirst({
    where: {
      pairId: ctx.pairId,
      date: {
        gte: start,
        lte: end,
      },
    },
    include: {
      items: {
        orderBy: { order: 'asc' },
        include: { place: true },
      },
    },
  });

  return Response.json(planDay);
}

export async function POST(req: Request) {
  const ctx = await getContext(req);
  if ('error' in ctx) return ctx.error;

  const body = await req.json();
  const { title, date } = body;

  if (!title || typeof title !== 'string') {
    return new Response('title is required', { status: 400 });
  }
  if (!date || typeof date !== 'string') {
    return new Response('date is required', { status: 400 });
  }

  const planDay = await prisma.planDay.create({
    data: {
      title,
      date: new Date(`${date}T00:00:00.000Z`),
      pairId: ctx.pairId,
      createdById: ctx.userId,
    },
  });

  return Response.json(planDay);
}

export async function PATCH(req: Request) {
  const ctx = await getContext(req);
  if ('error' in ctx) return ctx.error;

  const body = await req.json();
  const { id, title } = body;

  if (!id || typeof id !== 'number') {
    return new Response('id is required', { status: 400 });
  }
  if (!title || typeof title !== 'string') {
    return new Response('title is required', { status: 400 });
  }

  const existing = await prisma.planDay.findUnique({ where: { id } });
  if (!existing || existing.pairId !== ctx.pairId) {
    return new Response('not found', { status: 404 });
  }

  const updated = await prisma.planDay.update({
    where: { id },
    data: { title },
  });

  return Response.json(updated);
}

export async function DELETE(req: Request) {
  const ctx = await getContext(req);
  if ('error' in ctx) return ctx.error;

  const body = await req.json();
  const { id } = body;

  if (!id || typeof id !== 'number') {
    return new Response('id is required', { status: 400 });
  }

  const existing = await prisma.planDay.findUnique({ where: { id } });
  if (!existing || existing.pairId !== ctx.pairId) {
    return new Response('not found', { status: 404 });
  }
  await prisma.planDay.delete({ where: { id } });

  return new Response(null, { status: 204 });
}
