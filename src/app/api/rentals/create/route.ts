import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    console.log('Rental creation request received');
    
    // Get the rental data from request body
    const body = await req.json();
    const { toolId, startDate, endDate, totalAmount, transactionId, packageId } = body;
    
    console.log('Rental data:', { toolId, startDate, endDate, totalAmount, transactionId, packageId });

    // Validation
    if (!toolId || !startDate || !endDate || !totalAmount || !transactionId || !packageId) {
      console.log('Missing required fields');
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Mock rental creation since we're using Django backend
    const rental = {
      id: 1,
      toolId: parseInt(toolId),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalAmount: parseFloat(totalAmount),
      transactionId,
      packageId,
      status: 'active'
    };

    console.log('Rental created successfully:', rental);

    return NextResponse.json(
      { 
        message: "Rental created successfully",
        rental
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Rental creation error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 