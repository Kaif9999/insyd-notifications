import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
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

    // Check if the job exists
    const job = await prisma.job.findUnique({
      where: { id: id },
      include: {
        author: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Check if already applied
    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        userId_jobId: {
          userId: user.id,
          jobId: id,
        },
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: "Already applied to this job" },
        { status: 400 }
      );
    }

    // Create the application
    await prisma.jobApplication.create({
      data: {
        userId: user.id,
        jobId: id,
      },
    });

    // Create notification for job author
    await prisma.notification.create({
      data: {
        title: "Job Application",
        message: `${userEmail} applied to your job: ${job.title} at ${job.company}`,
        type: "application",
        userId: job.author.id,
      },
    });

    // Send email notification
    try {
      await sendEmail({
        to: job.author.email,
        subject: "📝 New Job Application!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #8E5BC2;">New Job Application!</h2>
            <p>Hi there!</p>
            <p><strong>${userEmail}</strong> has applied to your job posting:</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin: 0 0 10px 0;">${job.title}</h3>
              <p style="color: #666; margin: 0;"><strong>Company:</strong> ${job.company}</p>
            </div>
            <p>
              <a href="https://insyd-notifications.vercel.app/" style="background: #8E5BC2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Applications
              </a>
            </p>
          </div>
        `,
        text: `${userEmail} applied to your job: ${job.title} at ${job.company}`,
      });
    } catch (emailError) {
      console.error("Failed to send application email:", emailError);
    }

    return NextResponse.json({
      message: "Applied to job successfully",
    });
  } catch (error) {
    console.error("Error applying to job:", error);
    return NextResponse.json(
      { error: "Failed to apply to job" },
      { status: 500 }
    );
  }
}