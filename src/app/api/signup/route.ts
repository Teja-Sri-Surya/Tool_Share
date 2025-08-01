import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, username, email, password, category } = body;

    // Validation
    if (!fullName || !username || !email || !password || !category) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Create user in Django backend
    const response = await fetch('http://127.0.0.1:8000/api/users/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        first_name: fullName.split(' ')[0] || fullName,
        last_name: fullName.split(' ').slice(1).join(' ') || '',
        username,
        email,
        password,
        category: parseInt(category),
        is_owner: true,
        is_borrower: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { message: errorData.message || "Failed to create user" },
        { status: response.status }
      );
    }

    const userData = await response.json();

    return NextResponse.json(
      { 
        message: "User created successfully",
        user: {
          id: userData.id,
          fullName: `${userData.first_name} ${userData.last_name}`.trim(),
          username: userData.username,
          email: userData.email,
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 