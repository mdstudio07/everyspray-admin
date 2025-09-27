import { TRPCError, initTRPC } from '@trpc/server';
import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import superjson from 'superjson';

export const createTRPCContext = cache(async () => {
  const headersList = await headers();
  const cookieStore = await cookies();

  return {
    headers: Object.fromEntries(headersList.entries()),
    cookies: cookieStore,
  };
});

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

const authMiddleware = t.middleware(async ({ ctx, next }) => {
  const authCookie = ctx.cookies.get('auth-token');

  if (!authCookie) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return next({
    ctx: {
      ...ctx,
      user: { id: 'placeholder', role: 'user' }, // Placeholder until auth is implemented
    },
  });
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(authMiddleware);