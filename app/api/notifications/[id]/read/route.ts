import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const notification = await prisma.notification.update({
      where: { id: params.id },
      data: { read: true },
    });
    return NextResponse.json({ success: true, notification });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
} 