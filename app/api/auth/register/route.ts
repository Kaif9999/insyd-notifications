import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/mailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    console.log('Registering user with email:', email);

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: { email },
      });

      // Send welcome email
      try {
        await sendEmail({
          to: email,
          subject: '🎉 Welcome to Insyd!',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Welcome to Insyd!</h2>
              <p>Hi there!</p>
              <p>Welcome to the Insyd architecture community! You'll now receive notifications when:</p>
              <ul>
                <li>Someone likes your blog posts</li>
                <li>Someone applies to your job postings</li>
                <li>Your content gets interactions</li>
                <li>New content is posted by other members</li>
              </ul>
              <p>Start sharing your architectural insights and discoveries!</p>
              <p style="color: #666;">Visit <a href="http://localhost:3000">Insyd</a> to get started!</p>
            </div>
          `,
          text: `Welcome to Insyd! You'll receive notifications for interactions with your content.`,
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }

      console.log('New user created:', user.id);
    } else {
      console.log('User already exists:', user.id);
    }

    return NextResponse.json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json(
      //@ts-ignore
      { error: 'Failed to register user', details: error.message },
      { status: 500 }
    );
  }
}