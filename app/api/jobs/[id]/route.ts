import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { userEmail } = body;
    const jobId = params.id;

    if (!userEmail || !jobId) {
      return NextResponse.json(
        { error: "Missing userEmail or jobId" },
        { status: 400 }
      );
    }

    // Find the job to check if the user is the author
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        author: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Check if the user is the author of the job
    if (job.author.email !== userEmail) {
      return NextResponse.json(
        { error: "You can only delete your own jobs" },
        { status: 403 }
      );
    }

    // Delete the job (this will also cascade delete applications due to onDelete: Cascade)
    await prisma.job.delete({
      where: { id: jobId },
    });

    console.log(`Job ${jobId} deleted successfully by ${userEmail}`);

    return NextResponse.json({ 
      message: "Job deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting job:", error);
    return NextResponse.json(
      //@ts-ignore
      { error: "Failed to delete job", details: error.message },
      { status: 500 }
    );
  }
}