import { prisma } from '@/app/lib/prisma';
import { requireUser } from '@/app/lib/auth';

export async function GET() {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const user = await prisma.user.findUnique({ where: { id: auth.userId } });
  if (!user) {
    return new Response('not found', { status: 404 });
  }

  return Response.json({ id: user.id, name: user.name, username: user.username });
}
