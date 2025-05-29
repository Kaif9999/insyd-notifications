import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";

export async function GET() {
  try {
    console.log("Attempting to fetch jobs...");
    const jobs = await prisma.job.findMany({
      include: {
        author: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Manually get application counts for each job
    const jobsWithApplications = await Promise.all(
      jobs.map(async (job) => {
        const applicationCount = await prisma.jobApplication.count({
          where: { jobId: job.id },
        });
        return {
          ...job,
          applications: applicationCount,
        };
      })
    );

    console.log("Jobs fetched successfully:", jobs.length);
    return NextResponse.json({ jobs: jobsWithApplications });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      //@ts-ignore
      { error: "Failed to fetch jobs", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, title, company } = body;

    console.log("Creating job with data:", { email, title, company });

    // First, find or create the user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Let Prisma handle the timestamps automatically
      user = await prisma.user.create({
        data: { 
          email
          // Remove createdAt - let @default(now()) handle it
          // Remove updatedAt - let @updatedAt handle it
        },
      });
    }

    // Let Prisma handle the timestamps automatically for job creation too
    const job = await prisma.job.create({
      data: {
        title,
        company,
        authorId: user.id,
        // Remove createdAt and updatedAt - let Prisma handle them
      },
      include: {
        author: {
          select: {
            email: true,
          },
        },
      },
    });

    console.log("Job created successfully:", job.id);

    // Send email notifications to all users
    try {
      const allUsers = await prisma.user.findMany({
        where: { email: { not: email } }, // Don't send to the author
      });

      console.log(`Sending job notifications to ${allUsers.length} users`);

      for (const notifyUser of allUsers) {
        // Send email notification
        await sendEmail({
          to: notifyUser.email,
          subject: `💼 New Job Opportunity: ${title} at ${company}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">New Job Opportunity on Insyd!</h2>
              <p><strong>${user.email}</strong> just posted a new job:</p>
              <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2563eb;">
                <h3 style="margin: 0 0 10px 0; color: #1d4ed8;">${title}</h3>
                <p style="margin: 0; color: #666;"><strong>Company:</strong> ${company}</p>
              </div>
              <p style="color: #666;">Visit <a href="http://localhost:3000">Insyd</a> to learn more about this opportunity!</p>
            </div>
          `,
          text: `${user.email} posted a new job: ${title} at ${company}\n\nVisit http://localhost:3000 to learn more!`,
        });

        // Create notification record in database (let Prisma handle timestamps)
        await prisma.notification.create({
          data: {
            title: `New Job: ${title}`,
            content: `${user.email} posted a job at ${company}`,
            recipientId: notifyUser.id,
            // Remove createdAt and updatedAt - let Prisma handle them
          },
        });
      }

      console.log("Job email notifications sent successfully");
    } catch (emailError) {
      console.error("Failed to send job notifications:", emailError);
      // Don't fail the job creation if email fails
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      //@ts-ignore
      { error: "Failed to create job", details: error.message },
      { status: 500 }
    );
  }
}