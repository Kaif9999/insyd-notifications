import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("Attempting to fetch blogs...");
    const blogs = await prisma.blog.findMany({
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

    // Manually get like counts for each blog
    const blogsWithLikes = await Promise.all(
      blogs.map(async (blog) => {
        const likeCount = await prisma.blogLike.count({
          where: { blogId: blog.id },
        });
        return {
          ...blog,
          likes: likeCount,
        };
      })
    );

    console.log("Blogs fetched successfully:", blogs.length);
    return NextResponse.json({ blogs: blogsWithLikes });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return NextResponse.json(
      //@ts-ignore
      { error: "Failed to fetch blogs", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, title, content } = body;

    console.log("Creating blog with data:", { email, title, content });

    // First, find or create the user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Let Prisma handle the timestamps automatically
      user = await prisma.user.create({
        data: { 
          email
          // Remove manual timestamp setting
        },
      });
    }

    // Let Prisma handle the timestamps automatically
    const blog = await prisma.blog.create({
      data: {
        title,
        content,
        authorId: user.id,
        // Remove manual timestamp setting
      },
      include: {
        author: {
          select: {
            email: true,
          },
        },
      },
    });

    console.log("Blog created successfully:", blog.id);

    // Send email notifications to all users
    try {
      const allUsers = await prisma.user.findMany({
        where: { email: { not: email } }, // Don't send to the author
      });

      console.log(`Sending notifications to ${allUsers.length} users`);

      for (const notifyUser of allUsers) {
        // Send email notification
        await sendEmail({
          to: notifyUser.email,
          subject: `🔥 New Blog Post: ${title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">New Blog Post on Insyd!</h2>
              <p><strong>${user.email}</strong> just posted a new blog:</p>
              <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h3 style="margin: 0 0 10px 0; color: #2563eb;">${title}</h3>
                <p style="margin: 0; color: #666;">${content.substring(
                  0,
                  200
                )}${content.length > 200 ? "..." : ""}</p>
              </div>
              <p style="color: #666;">Visit <a href="http://localhost:3000">Insyd</a> to read the full post!</p>
            </div>
          `,
          text: `${user.email} posted a new blog: ${title}\n\n${content}\n\nVisit http://localhost:3000 to read more!`,
        });

        // Create notification record in database (let Prisma handle timestamps)
        await prisma.notification.create({
          data: {
            title: `New Blog Post: ${title}`,
            content: `${user.email} posted a new blog post`,
            recipientId: notifyUser.id,
            // Remove manual timestamp setting
          },
        });
      }

      console.log("Email notifications sent successfully");
    } catch (emailError) {
      console.error("Failed to send notifications:", emailError);
      // Don't fail the blog creation if email fails
    }

    return NextResponse.json({ blog });
  } catch (error) {
    console.error("Error creating blog:", error);
    return NextResponse.json(
      //@ts-ignore
      { error: "Failed to create blog", details: error.message },
      { status: 500 }
    );
  }
}
