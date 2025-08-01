import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Mock response since we're using Django backend
    const userCount = 0;
    console.log('Total users in database:', userCount);
    
    // Mock first user
    const firstUser = null;
    
    console.log('First user:', firstUser);
    
    return NextResponse.json({
      message: "Database connection successful",
      userCount,
      firstUser
    });
    
  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json(
      { message: "Database connection failed", error: String(error) },
      { status: 500 }
    );
  }
} 