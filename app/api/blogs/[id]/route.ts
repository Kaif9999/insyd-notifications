import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/mailer';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { userEmail } = body;
    const { id: blogId } = await params; // Fix: await params

    console.log('Deleting blog:', blogId, 'by user:', userEmail);

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

    // Check if user is the author
    if (blog.author.email !== userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get users who liked this blog (to notify them)
    const blogLikes = await prisma.blogLike.findMany({
      where: { blogId: blogId },
      include: {
        user: {
          select: { email: true }
        }
      }
    });

    // Delete the blog (this will cascade delete likes and notifications)
    await prisma.blog.delete({
      where: { id: blogId }
    });

    // Send notifications to users who liked the blog
    for (const like of blogLikes) {
      try {
        await sendEmail({
          to: like.user.email,
          subject: `📝 Blog you liked was deleted: ${blog.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Blog Update</h2>
              <p>The blog post you liked has been deleted by its author:</p>
              <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #dc2626;">
                <h3 style="margin: 0 0 10px 0; color: #dc2626;">${blog.title}</h3>
                <p style="margin: 0; color: #666;">Author: ${blog.author.email}</p>
              </div>
              <p style="color: #666;">Visit <a href="http://localhost:3000">Insyd</a> to discover more content!</p>
            </div>
          `,
          text: `The blog "${blog.title}" that you liked has been deleted.`,
        });
      } catch (emailError) {
        console.error('Failed to send deletion notification:', emailError);
      }
    }

    return NextResponse.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    return NextResponse.json(
      //@ts-ignore
      { error: 'Failed to delete blog', details: error.message },
      { status: 500 }
    );
  }
}