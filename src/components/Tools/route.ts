import { NextResponse } from 'next/server';
// DISABLED: Using Django with MySQL instead of Prisma
// import { PrismaClient } from '@prisma/client';

// let prisma: PrismaClient;

// if (process.env.NODE_ENV === 'production') {
//   prisma = new PrismaClient();
// } else {
//   // Prevent multiple instances of Prisma Client in development
//   if (!(global as any).prisma) {
//     (global as any).prisma = new PrismaClient();
//   }
//   prisma = (global as any).prisma;
// }

// Disable Prisma client to prevent connection errors
const prisma = null;

// UTILS TO EXTRACT ID
function extractIdFromUrl(request: Request) {
  const url = new URL(request.url);
  const segments = url.pathname.split('/');
  return segments[segments.length - 1];
}

// --- TOOLS API ---
export async function GET() {
  try {
    // const tools = await prisma.tool.findMany();
    // return Response.json(tools);
    return Response.json({ message: "Prisma disabled - using Django API instead" });
  } catch (error) {
    return Response.json({ error: 'Failed to fetch tools' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // const tool = await prisma.tool.create({ data: body });
    // return Response.json(tool);
    return Response.json({ message: "Prisma disabled - using Django API instead" });
  } catch (error) {
    return Response.json({ error: 'Failed to create tool' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();
    // const updated = await prisma.tool.update({
    //   where: { id: Number(id) },
    //   data: body,
    // });
    // return Response.json(updated);
    return Response.json({ message: "Prisma disabled - using Django API instead" });
  } catch (error) {
    return Response.json({ error: 'Failed to update tool' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    // const deleted = await prisma.tool.delete({ where: { id: Number(id) } });
    // return Response.json(deleted);
    return Response.json({ message: "Prisma disabled - using Django API instead" });
  } catch (error) {
    return Response.json({ error: 'Failed to delete tool' }, { status: 500 });
  }
}