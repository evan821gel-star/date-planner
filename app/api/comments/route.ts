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
  const { postId, content, createdByName } = body;

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
      createdByName: typeof createdByName === 'string' && createdByName.trim() !== '' ? createdByName.trim() : null,
    },
    include: { createdBy: true },
  });

  return Response.json(comment);
}
