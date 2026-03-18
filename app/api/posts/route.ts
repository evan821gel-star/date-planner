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

  const posts = await prisma.post.findMany({
    where: { pairId: ctx.pairId },
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: true,
      comments: {
        orderBy: { createdAt: 'asc' },
        include: { createdBy: true },
      },
    },
  });

  return Response.json(posts);
}

export async function POST(req: Request) {
  const ctx = await getContext(req);
  if ('error' in ctx) return ctx.error;

  const body = await req.json();
  const { content, imageUrl } = body;

  if (!content || typeof content !== 'string') {
    return new Response('content is required', { status: 400 });
  }

  const post = await prisma.post.create({
    data: {
      content: content.trim(),
      imageUrl: typeof imageUrl === 'string' && imageUrl.trim() !== '' ? imageUrl.trim() : null,
      pairId: ctx.pairId,
      createdById: ctx.userId,
    },
    include: { createdBy: true },
  });

  return Response.json(post);
}
