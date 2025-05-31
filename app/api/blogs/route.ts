import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";

export async function GET() {
  try {
    const blogs = await prisma.blog.findMany({
      include: {
        author: {
          select: {
            email: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const blogsWithLikes = blogs.map((blog: { _count: { likes: number; }; }) => ({
      ...blog,
      likes: blog._count.likes,
    }));

    return NextResponse.json({ blogs: blogsWithLikes });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return NextResponse.json(
      { error: "Failed to fetch blogs", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, title, content } = body; // Fix: Use title and content, not company

    console.log("Creating blog with data:", { email, title, content });

    // Fix: Check for title and content, not company
    if (!email || !title || !content) {
      return NextResponse.json(
        { error: "Missing required fields: email, title, and content are required" },
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

    // Create the blog with correct fields
    const blog = await prisma.blog.create({
      data: {
        title,
        content, // Fix: Use content field
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

    // Get followers of the user who created the blog
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
          title: "New Blog Post",
          message: `${email} posted a new blog: ${title}`,
          type: "blog",
          userId: follow.follower.id,
        },
      });

      // Send email to follower
      try {
        await sendEmail({
          to: follow.follower.email,
          subject: "📝 New Blog Post from Someone You Follow",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #8E5BC2;">New Blog Post!</h2>
              <p>Hi there!</p>
              <p><strong>${email}</strong> just posted a new blog that you might be interested in:</p>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin: 0 0 10px 0;">${title}</h3>
                <p style="color: #666; margin: 0;">${content.substring(0, 200)}${content.length > 200 ? '...' : ''}</p>
              </div>
              <p>
                <a href="https://insyd-notifications.vercel.app/" style="background: #8E5BC2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Read Full Post
                </a>
              </p>
              <p style="color: #666; font-size: 14px;">
                You received this because you follow ${email} on Insyd.
              </p>
            </div>
          `,
          text: `${email} posted a new blog: ${title}. ${content.substring(0, 200)}${content.length > 200 ? '...' : ''}`,
        });
        console.log(`Blog notification email sent to ${follow.follower.email}`);
      } catch (emailError) {
        console.error("Failed to send blog email to", follow.follower.email, ":", emailError);
      }
    }

    console.log(`Blog created successfully. Notified ${followers.length} followers.`);

    return NextResponse.json({
      message: "Blog created successfully",
      blog,
      notifiedFollowers: followers.length
    });
  } catch (error) {
    console.error("Error creating blog:", error);
    return NextResponse.json(
      { error: "Failed to create blog", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}