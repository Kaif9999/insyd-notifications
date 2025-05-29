import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ notifications: [] });
    }

    // Fix: Use 'userId' instead of 'recipientId'
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id }, // Changed from recipientId to userId
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { notificationId, email } = body;

    if (!notificationId || !email) {
      return NextResponse.json(
        { error: "Missing notificationId or email" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
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
        id: notificationId,
        userId: user.id, // Changed from recipientId to userId
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
      message: "Notification marked as read" 
    });
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}
