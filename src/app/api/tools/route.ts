import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // Get the tool data from request body
    const body = await req.json();
    const { name, category, description, dailyRate, imageUrl } = body;

    // Validation
    if (!name || !category || !description || !dailyRate || !imageUrl) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Create the tool (mock response since we're using Django backend)
    const tool = { 
      id: 1, 
      name, 
      category, 
      description, 
      dailyRate: parseFloat(dailyRate), 
      imageUrl, 
      isAvailable: true, 
      ownerId: 1 
    };

    return NextResponse.json(
      { 
        message: "Tool created successfully",
        tool 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Tool creation error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    // Get all tools (mock response since we're using Django backend)
    const tools: any[] = [];

    return NextResponse.json({ tools });
  } catch (error) {
    console.error("Error fetching tools:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 