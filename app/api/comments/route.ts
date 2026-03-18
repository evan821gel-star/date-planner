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

export async function POST(req: Request) {
  const ctx = await getContext(req);
  if ('error' in ctx) return ctx.error;

  const body = await req.json();
  const { postId, content } = body;

  if (!postId || typeof postId !== 'number') {
    return new Response('postId is required', { status: 400 });
  }
  if (!content || typeof content !== 'string') {
    return new Response('content is required', { status: 400 });
  }

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post || post.pairId !== ctx.pairId) {
    return new Response('not found', { status: 404 });
  }

  const comment = await prisma.comment.create({
    data: {
      content: content.trim(),
      postId,
      pairId: ctx.pairId,
      createdById: ctx.userId,
    },
    include: { createdBy: true },
  });

  return Response.json(comment);
}
