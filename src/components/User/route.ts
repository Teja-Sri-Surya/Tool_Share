import { NextResponse } from 'next/server';

function extractIdFromUrl(request: Request) {
  const url = new URL(request.url);
  const segments = url.pathname.split('/');
  return segments[segments.length - 1];
}

export async function GET(req: Request) {
  const users: any[] = [];
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const body = await req.json();
  const user = { id: 1, ...body };
  return NextResponse.json(user);
}

export async function PUT(req: Request) {
  const body = await req.json();
  const id = extractIdFromUrl(req);
  const updated = { id: Number(id), ...body };
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const id = extractIdFromUrl(req);
  const deleted = { id: Number(id) };
  return NextResponse.json(deleted);
}