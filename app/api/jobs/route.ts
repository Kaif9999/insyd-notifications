import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        author: {
          select: {
            email: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const jobsWithApplications = jobs.map((job: { _count: { applications: number; }; }) => ({
      ...job,
      applications: job._count.applications,
    }));

    return NextResponse.json({ jobs: jobsWithApplications });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, company, title } = body;

    console.log("Creating job with data:", { email, company, title });

    if (!email || !company || !title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Create the job
    const job = await prisma.job.create({
      data: {
        title,
        company,
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            email: true,
          },
        },
      },
    });

    // Get followers of the user who created the job
    const followers = await prisma.follow.findMany({
      where: { followingId: user.id },
      include: { follower: true }
    });

    console.log(`Found ${followers.length} followers for user ${email}`);

    // Create notifications and send emails only to followers
    for (const follow of followers) {
      // Create in-app notification
      await prisma.notification.create({
        data: {
          title: "New Job Posting",
          message: `${email} posted a new job at ${company}: ${title}`,
          type: "job",
          userId: follow.follower.id,
        },
      });

      // Send email to follower
      try {
        await sendEmail({
          to: follow.follower.email,
          subject: "💼 New Job Opportunity from Someone You Follow",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #8E5BC2;">New Job Opportunity!</h2>
              <p>Hi there!</p>
              <p><strong>${email}</strong> just posted a new job opportunity that might interest you:</p>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin: 0 0 10px 0;">${title}</h3>
                <p style="color: #666; margin: 0;"><strong>Company:</strong> ${company}</p>
              </div>
              <p>
                <a href="https://insyd-notifications.vercel.app/" style="background: #8E5BC2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  View Job & Apply
                </a>
              </p>
              <p style="color: #666; font-size: 14px;">
                You received this because you follow ${email} on Insyd.
              </p>
            </div>
          `,
          text: `${email} posted a new job at ${company}: ${title}`,
        });
        console.log(`Job notification email sent to ${follow.follower.email}`);
      } catch (emailError) {
        console.error("Failed to send job email to", follow.follower.email, ":", emailError);
      }
    }

    console.log(`Job created successfully. Notified ${followers.length} followers.`);

    return NextResponse.json({
      message: "Job created successfully",
      job,
      notifiedFollowers: followers.length
    });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { error: "Failed to create job", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}