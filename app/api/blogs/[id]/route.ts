import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(
  request: Request,
  { params }: RouteParams
) {
  try {
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

    // Check if the blog exists and belongs to the user
    const blog = await prisma.blog.findFirst({
      where: {
        id: id,
        authorId: user.id,
      },
    });

    if (!blog) {
      return NextResponse.json(
        { error: "Blog not found or unauthorized" },
        { status: 404 }
      );
    }

    // Delete the blog
    await prisma.blog.delete({
      where: { id: id },
    });

    return NextResponse.json({
      message: "Blog deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting blog:", error);
    return NextResponse.json(
      { error: "Failed to delete blog" },
      { status: 500 }
    );
  }
}