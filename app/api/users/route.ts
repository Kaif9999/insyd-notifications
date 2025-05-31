import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface UserFromDatabase {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  followers: Array<{ id: string }>;
  _count: {
    followers: number;
    following: number;
    blogs: number;
    jobs: number;
  };
}

interface UserWithFollowStatus {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  isFollowing: boolean;
  followers: number;
  following: number;
  blogs: number;
  jobs: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const currentUserEmail = searchParams.get('currentUser');

    console.log('Users API called with:', currentUserEmail);

    if (!currentUserEmail) {
      return NextResponse.json(
        { error: "Current user email is required" },
        { status: 400 }
      );
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: currentUserEmail },
    });

    console.log('Current user found:', currentUser?.id);

    if (!currentUser) {
      return NextResponse.json(
        { error: "Current user not found" },
        { status: 404 }
      );
    }

    const users = await prisma.user.findMany({
      where: {
        email: { not: currentUserEmail }
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            blogs: true,
            jobs: true,
          }
        },
        followers: {
          where: {
            followerId: currentUser.id
          },
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Found users:', users.length);
    
    const usersWithFollowStatus: UserWithFollowStatus[] = users.map((user: UserFromDatabase) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
      isFollowing: user.followers.length > 0,
      followers: user._count.followers,
      following: user._count.following,
      blogs: user._count.blogs,
      jobs: user._count.jobs,
    }));

    return NextResponse.json({ users: usersWithFollowStatus });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}