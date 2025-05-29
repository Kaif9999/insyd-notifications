import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/mailer';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { userEmail } = body;
    const { id: jobId } = await params; // Fix: await params

    console.log('Processing application for job:', jobId, 'by user:', userEmail);

    // Get the job with author info
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        author: {
          select: { email: true }
        }
      }
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Find the user who applied
    const applicant = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!applicant) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already applied - Fix: Use correct table name
    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        jobId_userId: {
          jobId: jobId,
          userId: applicant.id
        }
      }
    });

    if (existingApplication) {
      return NextResponse.json({ error: 'Already applied to this job' }, { status: 400 });
    }

    // Create job application
    await prisma.jobApplication.create({
      data: {
        jobId: jobId,
        userId: applicant.id
      }
    });

    // Send email notification to job poster
    try {
      await sendEmail({
        to: job.author.email,
        subject: `📧 New application for your job: ${job.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">New Job Application! 📧</h2>
            <p><strong>${userEmail}</strong> applied to your job posting:</p>
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2563eb;">
              <h3 style="margin: 0 0 10px 0; color: #1d4ed8;">${job.title}</h3>
              <p style="margin: 0; color: #666;"><strong>Company:</strong> ${job.company}</p>
            </div>
            <p>Applicant Email: <strong>${userEmail}</strong></p>
            <p style="color: #666;">Visit <a href="http://localhost:3000">Insyd</a> to manage your job postings!</p>
          </div>
        `,
        text: `${userEmail} applied to your job: ${job.title} at ${job.company}`,
      });

      // Create in-app notification
      await prisma.notification.create({
        data: {
          title: `📧 New job application!`,
          content: `${userEmail} applied to your job: ${job.title}`,
          recipientId: job.authorId,
        },
      });
    } catch (emailError) {
      console.error('Failed to send application notification:', emailError);
    }

    // Get updated application count
    const applicationCount = await prisma.jobApplication.count({
      where: { jobId: jobId }
    });

    return NextResponse.json({ applications: applicationCount });
  } catch (error) {
    console.error('Error processing job application:', error);
    return NextResponse.json(
      //@ts-ignore
      { error: 'Failed to process application', details: error.message },
      { status: 500 }
    );
  }
}