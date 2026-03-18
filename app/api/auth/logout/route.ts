import { clearSession } from '@/app/lib/auth';

export async function POST() {
  await clearSession();
  return new Response(null, { status: 204 });
}
