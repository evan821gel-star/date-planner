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
  const monthStr = searchParams.get('month');

  if (!monthStr) {
    return new Response('month is required', { status: 400 });
  }

  const [yearStr, monthNumStr] = monthStr.split('-');
  const year = Number(yearStr);
  const monthNum = Number(monthNumStr);

  if (!year || !monthNum || monthNum < 1 || monthNum > 12) {
    return new Response('month is invalid', { status: 400 });
  }

  const start = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59, 999));

  const plans = await prisma.planDay.findMany({
    where: {
      pairId: ctx.pairId,
      date: {
        gte: start,
        lte: end,
      },
    },
    select: {
      id: true,
      title: true,
      date: true,
    },
    orderBy: {
      date: 'asc',
    },
  });

  return Response.json(plans);
}
