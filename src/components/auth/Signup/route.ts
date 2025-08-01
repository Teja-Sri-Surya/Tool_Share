import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, username, email, password } = body;

    // Simple validation
    if (!fullName || !username || !email || !password) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    // For now, return a simple response since we're using Django backend
    const user = { id: 1, fullName, username, email };

    return NextResponse.json({ user }, { status: 201 });

  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
