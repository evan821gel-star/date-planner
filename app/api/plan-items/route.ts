import { prisma } from '@/app/lib/prisma';
import { requireUser } from '@/app/lib/auth';

async function getContext(req: Request) {
  const auth = await requireUser();
  if ('error' in auth) return { error: auth.error };
  const userId = auth.userId;
  const membership = await prisma.pairMember.findFirst({
    where: { userId },
  });
  if (!membership) {
    return { error: new Response('pair not found', { status: 404 }) };
  }
  return { userId, pairId: membership.pairId };
}

export async function POST(req: Request) {
  const ctx = await getContext(req);
  if ('error' in ctx) return ctx.error;

  const body = await req.json();
  const { planDayId, placeId, title, createdByName } = body;

  if (!planDayId || typeof planDayId !== 'number') {
    return new Response('planDayId is required', { status: 400 });
  }
  const hasPlaceId = typeof placeId === 'number';
  const hasTitle = typeof title === 'string' && title.trim() !== '';
  if (!hasPlaceId && !hasTitle) {
    return new Response('placeId or title is required', { status: 400 });
  }

  const planDay = await prisma.planDay.findUnique({ where: { id: planDayId } });
  if (!planDay || planDay.pairId !== ctx.pairId) {
    return new Response('not found', { status: 404 });
  }

  const lastItem = await prisma.planItem.findFirst({
    where: { planDayId },
    orderBy: { order: 'desc' },
  });

  const nextOrder = lastItem ? lastItem.order + 1 : 1;

  const data: {
    planDay: { connect: { id: number } };
    order: number;
    title: string | null;
    kind: 'PLACE' | 'CUSTOM';
    place?: { connect: { id: number } };
    createdBy: { connect: { id: number } };
    createdByName?: string | null;
  } = {
    planDay: { connect: { id: planDayId } },
    order: nextOrder,
    title: hasTitle ? title.trim() : null,
    kind: hasPlaceId ? 'PLACE' : 'CUSTOM',
    createdBy: { connect: { id: ctx.userId } },
  };
  if (typeof createdByName === 'string' && createdByName.trim() !== '') {
    data.createdByName = createdByName.trim();
  }

  if (hasPlaceId) {
    data.place = { connect: { id: placeId } };
  }

  const item = await prisma.planItem.create({
    data,
    include: { place: true },
  });

  return Response.json(item);
}

export async function PATCH(req: Request) {
  const ctx = await getContext(req);
  if ('error' in ctx) return ctx.error;

  const body = await req.json();
  const { id, startTime, endTime, note } = body;

  if (!id || typeof id !== 'number') {
    return new Response('id is required', { status: 400 });
  }

  const existing = await prisma.planItem.findUnique({
    where: { id },
    include: { planDay: true },
  });
  if (!existing || existing.planDay.pairId !== ctx.pairId) {
    return new Response('not found', { status: 404 });
  }

  const updated = await prisma.planItem.update({
    where: { id },
    data: {
      startTime: typeof startTime === 'string' ? startTime : null,
      endTime: typeof endTime === 'string' ? endTime : null,
      note: typeof note === 'string' ? note : null,
    },
    include: { place: true },
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

  const existing = await prisma.planItem.findUnique({
    where: { id },
    include: { planDay: true },
  });
  if (!existing || existing.planDay.pairId !== ctx.pairId) {
    return new Response('not found', { status: 404 });
  }
  await prisma.planItem.delete({ where: { id } });

  return new Response(null, { status: 204 });
}
