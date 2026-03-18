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
  const { content, imageUrl, createdByName } = body;

  if (!content || typeof content !== 'string') {
    return new Response('content is required', { status: 400 });
  }

  const post = await prisma.post.create({
    data: {
      content: content.trim(),
      imageUrl: typeof imageUrl === 'string' && imageUrl.trim() !== '' ? imageUrl.trim() : null,
      pairId: ctx.pairId,
      createdById: ctx.userId,
      createdByName: typeof createdByName === 'string' && createdByName.trim() !== '' ? createdByName.trim() : null,
    },
    include: { createdBy: true },
  });

  return Response.json(post);
}
