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
    const { id: blogId } = await params;
    
    const body = await request.json();
    const { userEmail } = body;

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email is required" },
        { status: 400 }
      );
    }

    // Find the user who is liking
    const liker = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!liker) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if the blog exists
    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
      include: {
        author: true,
      },
    });

    if (!blog) {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404 }
      );
    }

    // Check if already liked - Fix: Use correct field order
    const existingLike = await prisma.blogLike.findUnique({
      where: {
        userId_blogId: { // Fix: Correct order (userId first, then blogId)
          userId: liker.id,
          blogId: blogId
        }
      }
    });

    if (existingLike) {
      return NextResponse.json(
        { error: "Already liked this blog" },
        { status: 400 }
      );
    }

    // Create the like
    await prisma.blogLike.create({
      data: {
        userId: liker.id,
        blogId: blogId,
      },
    });

    // Create notification for blog author (if not self-like)
    if (blog.author.id !== liker.id) {
      await prisma.notification.create({
        data: {
          title: "Blog Liked",
          message: `${userEmail} liked your blog: ${blog.title}`,
          type: "like",
          userId: blog.author.id,
        },
      });

      // Send email notification
      try {
        await sendEmail({
          to: blog.author.email,
          subject: "👍 Someone liked your blog!",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #8E5BC2;">Blog Liked!</h2>
              <p>Hi there!</p>
              <p><strong>${userEmail}</strong> liked your blog post:</p>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin: 0;">${blog.title}</h3>
              </div>
              <p>
                <a href="https://insyd-notifications.vercel.app/" style="background: #8E5BC2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  View Your Blog
                </a>
              </p>
            </div>
          `,
          text: `${userEmail} liked your blog: ${blog.title}`,
        });
      } catch (emailError) {
        console.error("Failed to send like email:", emailError);
      }
    }

    return NextResponse.json({
      message: "Blog liked successfully",
    });
  } catch (error) {
    console.error("Error liking blog:", error);
    return NextResponse.json(
      { error: "Failed to like blog" },
      { status: 500 }
    );
  }
}