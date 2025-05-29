import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>; // Fix: params is now a Promise
}

export async function POST(
  request: Request,
  { params }: RouteParams // Fix: Use proper type
) {
  try {
    const { id } = await params; // Fix: Await the params
    
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

    // Update notification as read, ensuring it belongs to the user
    const notification = await prisma.notification.updateMany({
      where: {
        id: id,
        userId: user.id, // Ensure the notification belongs to this user
      },
      data: {
        read: true,
      },
    });

    if (notification.count === 0) {
      return NextResponse.json(
        { error: "Notification not found or not authorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}