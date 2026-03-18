import { prisma } from '@/app/lib/prisma';

export async function GET() {
  const users = await prisma.user.findMany({ orderBy: { id: 'asc' } });

  if (users.length > 0) {
    return Response.json(users);
  }

  const created = await prisma.$transaction(async (tx: typeof prisma) => {
    const pair = await tx.pair.create({ data: {} });
    const userA = await tx.user.create({ data: { name: 'あなた' } });
    const userB = await tx.user.create({ data: { name: 'パートナー' } });
    await tx.pairMember.createMany({
      data: [
        { pairId: pair.id, userId: userA.id },
        { pairId: pair.id, userId: userB.id },
      ],
    });
    await tx.place.updateMany({
      where: { pairId: null },
      data: { pairId: pair.id, createdById: userA.id },
    });
    await tx.planDay.updateMany({
      where: { pairId: null },
      data: { pairId: pair.id, createdById: userA.id },
    });
    await tx.planItem.updateMany({
      where: { createdById: null },
      data: { createdById: userA.id },
    });
    return [userA, userB];
  });

  return Response.json(created);
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, name } = body;

  if (!id || typeof id !== 'number') {
    return new Response('id is required', { status: 400 });
  }
  if (!name || typeof name !== 'string') {
    return new Response('name is required', { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { name: name.trim() },
  });

  return Response.json(updated);
}
