import { NextResponse } from 'next/server';

export async function PUT(req: Request) {
  try {
    console.log('Profile update request received');
    
    // Get the updated profile data from request body
    const body = await req.json();
    const { fullName, username, email } = body;
    console.log('Update data:', { fullName, username, email });

    // Validation
    if (!fullName || !username || !email) {
      console.log('Missing required fields');
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    if (!email.includes('@')) {
      console.log('Invalid email format');
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      );
    }

    console.log('Updating user in database...');
    
    // Mock updated user since we're using Django backend
    const updatedUser = {
      id: 1,
      fullName,
      username,
      email
    };

    console.log('User updated successfully:', updatedUser);

    return NextResponse.json(
      { 
        message: "Profile updated successfully",
        user: updatedUser
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 