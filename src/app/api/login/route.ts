import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // For now, return a simple response since we're using Django backend
    const response = NextResponse.json(
      { 
        message: "Login successful",
        user: {
          id: 1,
          email: email,
          fullName: "Test User",
          username: "testuser",
        }
      },
      { status: 200 }
    );

    // Set HTTP-only cookie
    response.cookies.set('auth-token', 'dummy-token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 