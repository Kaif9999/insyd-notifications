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
    const { id: blogId } = await params; // Fix: await params

    console.log('Processing like for blog:', blogId, 'by user:', userEmail);

    // Get the blog with author info
    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
      include: {
        author: {
          select: { email: true }
        }
      }
    });

    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    // Find the user who liked
    const liker = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!liker) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already liked
    const existingLike = await prisma.blogLike.findUnique({
      where: {
        blogId_userId: {
          blogId: blogId,
          userId: liker.id
        }
      }
    });

    if (existingLike) {
      // Unlike the blog
      await prisma.blogLike.delete({
        where: { id: existingLike.id }
      });
    } else {
      // Like the blog
      await prisma.blogLike.create({
        data: {
          blogId: blogId,
          userId: liker.id
        }
      });

      // Send email notification to blog author (only if different user)
      if (blog.author.email !== userEmail) {
        try {
          await sendEmail({
            to: blog.author.email,
            subject: `👍 Someone liked your blog: ${blog.title}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Your blog got a like! 👍</h2>
                <p><strong>${userEmail}</strong> liked your blog post:</p>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <h3 style="margin: 0 0 10px 0; color: #2563eb;">${blog.title}</h3>
                </div>
                <p style="color: #666;">Visit <a href="http://localhost:3000">Insyd</a> to see your blog!</p>
              </div>
            `,
            text: `${userEmail} liked your blog: ${blog.title}`,
          });

          // Create in-app notification
          await prisma.notification.create({
            data: {
              title: `👍 Your blog got a like!`,
              content: `${userEmail} liked your blog: ${blog.title}`,
              recipientId: blog.authorId,
            },
          });
        } catch (emailError) {
          console.error('Failed to send like notification:', emailError);
        }
      }
    }

    // Get updated like count
    const likeCount = await prisma.blogLike.count({
      where: { blogId: blogId }
    });

    return NextResponse.json({ likes: likeCount });
  } catch (error) {
    console.error('Error processing blog like:', error);
    return NextResponse.json(
      //@ts-ignore
      { error: 'Failed to process like', details: error.message },
      { status: 500 }
    );
  }
}