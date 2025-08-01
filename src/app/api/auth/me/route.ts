import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    // For now, return a simple mock user since we're using Django backend
    const user = {
      id: 1,
      email: 'test@example.com',
      fullName: 'Test User',
      username: 'testuser',
    };

    return NextResponse.json({ user });

  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 