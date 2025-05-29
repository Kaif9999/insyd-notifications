import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, title, content } = await req.json();

  // Get or create user
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) user = await prisma.user.create({ data: { email } });

  const blog = await prisma.blog.create({
    data: { title, content, authorId: user.id },
  });

  // Simulated followers
  const followers = await prisma.user.findMany({
    where: { email: { not: email } }, // Notify all others for POC
  });

  for (const follower of followers) {
    await prisma.notification.create({
      data: {
        type: "new_blog",
        message: `${email} posted a new blog: ${title}`,
        recipientId: follower.id,
      },
    });

    await sendEmail(
      follower.email,
      "New Blog on Insyd",
      `<p>${email} just posted a new blog: <b>${title}</b></p>`
    );
  }

  return NextResponse.json({ success: true, blog });
}
