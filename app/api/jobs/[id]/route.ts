import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Fix: Add proper type for the params
interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(
  request: Request,
  { params }: RouteParams // Fix: Use the proper type
) {
  try {
    // Await the params since it's a Promise in Next.js 15
    const { id } = await params;
    
    const body = await request.json();
    const { userEmail } = body;

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email is required" },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if the job exists and belongs to the user
    const job = await prisma.job.findFirst({
      where: {
        id: id,
        authorId: user.id,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found or unauthorized" },
        { status: 404 }
      );
    }

    // Delete the job
    await prisma.job.delete({
      where: { id: id },
    });

    return NextResponse.json({
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting job:", error);
    return NextResponse.json(
      { error: "Failed to delete job" },
      { status: 500 }
    );
  }
}