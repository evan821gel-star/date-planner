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

async function fetchOgpImage(url: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const html = await res.text();

    const ogImageRegex =
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i;
    const ogImageRegexAlt =
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["'][^>]*>/i;

    const match = html.match(ogImageRegex) ?? html.match(ogImageRegexAlt);
    if (!match) return null;

    const raw = match[1].trim();
    if (!raw) return null;

    const absolute = new URL(raw, url).toString();
    return absolute;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const ctx = await getContext(req);
  if ('error' in ctx) return ctx.error;

  const places = await prisma.place.findMany({
    where: { pairId: ctx.pairId },
    orderBy: { createdAt: 'desc' },
    include: { createdBy: true },
  });
  return Response.json(places);
}

export async function POST(req: Request) {
  const ctx = await getContext(req);
  if ('error' in ctx) return ctx.error;

  const body = await req.json();
  const { name, url, createdByName } = body;

  if (!name || typeof name !== 'string') {
    return new Response('name is required', { status: 400 });
  }

  const normalizedUrl =
    typeof url === 'string' && url.trim() !== '' ? url.trim() : null;
  const imageUrl = normalizedUrl ? await fetchOgpImage(normalizedUrl) : null;

  const place = await prisma.place.create({
    data: {
      name,
      url: normalizedUrl,
      imageUrl,
      pairId: ctx.pairId,
      createdById: ctx.userId,
      createdByName: typeof createdByName === 'string' && createdByName.trim() !== '' ? createdByName.trim() : null,
    },
    include: { createdBy: true },
  });

  return Response.json(place);
}

export async function PATCH(req: Request) {
  const ctx = await getContext(req);
  if ('error' in ctx) return ctx.error;

  const body = await req.json();
  const { id, memo, prefecture, visited } = body;

  if (!id || typeof id !== 'number') {
    return new Response('id is required', { status: 400 });
  }

  const updateData: {
    memo?: string | null;
    prefecture?: string | null;
    visited?: boolean;
    visitedAt?: Date | null;
  } = {};

  if (typeof memo === 'string') {
    updateData.memo = memo;
  }
  if (typeof prefecture === 'string') {
    updateData.prefecture = prefecture;
  }
  if (typeof visited === 'boolean') {
    updateData.visited = visited;
    updateData.visitedAt = visited ? new Date() : null;
  }

  const updated = await prisma.place.update({
    where: { id },
    data: {
      ...updateData,
    },
    include: { createdBy: true },
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

  const place = await prisma.place.findUnique({ where: { id } });
  if (!place || place.pairId !== ctx.pairId) {
    return new Response('not found', { status: 404 });
  }
  await prisma.place.delete({ where: { id } });

  return new Response(null, { status: 204 });
}
