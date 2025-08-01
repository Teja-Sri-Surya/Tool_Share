// /lib/prismadb.ts
// DISABLED: Using Django with MySQL instead of Prisma
// import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: any | undefined;
}

// Disable Prisma client to prevent connection errors
const client = null;
if (process.env.NODE_ENV !== 'production') globalThis.prisma = client;

export { client as prisma };
