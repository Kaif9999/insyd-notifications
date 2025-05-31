import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { followerEmail, followingEmail } = body;

    if (!followerEmail || !followingEmail) {
      return NextResponse.json(
        { error: "Both follower and following emails are required" },
        { status: 400 }
      );
    }

    if (followerEmail === followingEmail) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    // Find both users
    const [follower, following] = await Promise.all([
      prisma.user.findUnique({ where: { email: followerEmail } }),
      prisma.user.findUnique({ where: { email: followingEmail } })
    ]);

    if (!follower || !following) {
      return NextResponse.json(
        { error: "One or both users not found" },
        { status: 404 }
      );
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: follower.id,
          followingId: following.id,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json(
        { error: "Already following this user" },
        { status: 400 }
      );
    }

    // Create the follow relationship
    await prisma.follow.create({
      data: {
        followerId: follower.id,
        followingId: following.id,
      },
    });

    // notification for the followed user
    await prisma.notification.create({
      data: {
        title: "New Follower",
        message: `${followerEmail} is now following you`,
        type: "follow",
        userId: following.id,
      },
    });

    // email notification to the followed user
    try {
      await sendEmail({
        to: followingEmail,
        subject: "🎉 You have a new follower on Insyd!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #8E5BC2;">New Follower!</h2>
            <p>Hi there!</p>
            <p><strong>${followerEmail}</strong> is now following you on Insyd!</p>
            <p>They'll now receive notifications when you post new blogs or jobs.</p>
            <p style="color: #666;">
              <a href="https://insyd-notifications.vercel.app/" style="color: #8E5BC2;">Visit Insyd</a> to see your growing community!
            </p>
          </div>
        `,
        text: `${followerEmail} is now following you on Insyd!`,
      });
    } catch (emailError) {
      console.error("Failed to send follow email:", emailError);
    }

    return NextResponse.json({ 
      message: "Successfully followed user" 
    });
  } catch (error) {
    console.error("Error following user:", error);
    return NextResponse.json(
      { error: "Failed to follow user" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { followerEmail, followingEmail } = body;

    if (!followerEmail || !followingEmail) {
      return NextResponse.json(
        { error: "Both follower and following emails are required" },
        { status: 400 }
      );
    }

    // Find both follower and following users
    const [follower, following] = await Promise.all([
      prisma.user.findUnique({ where: { email: followerEmail } }),
      prisma.user.findUnique({ where: { email: followingEmail } })
    ]);

    if (!follower || !following) {
      return NextResponse.json(
        { error: "One or both users not found" },
        { status: 404 }
      );
    }

    // Delete the follow relationship
    const deleted = await prisma.follow.deleteMany({
      where: {
        followerId: follower.id,
        followingId: following.id,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "Follow relationship not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: "Successfully unfollowed user" 
    });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return NextResponse.json(
      { error: "Failed to unfollow user" },
      { status: 500 }
    );
  }
}