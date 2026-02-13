import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

/* ============================
   POST → Activate Subscription
============================ */
export async function POST() {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // If user doesn't exist, create one
    if (!user) {
      const clerkUser = await currentUser();

      if (!clerkUser || !clerkUser.emailAddresses?.length) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      user = await prisma.user.create({
        data: {
          id: userId,
          email: clerkUser.emailAddresses[0].emailAddress,
          isSubscribed: false,
        },
      });
    }

    // Set subscription to 1 month from now
    const subscriptionEnds = new Date();
    subscriptionEnds.setMonth(subscriptionEnds.getMonth() + 1);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isSubscribed: true,
        subscriptionEnds,
      },
    });

    return NextResponse.json({
      message: "Subscription successful",
      subscriptionEnds: updatedUser.subscriptionEnds,
    });
  } catch (error) {
    console.error("Error updating subscription:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ============================
   GET → Check Subscription
============================ */
export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isSubscribed: true,
        subscriptionEnds: true,
      },
    });

    // If user does not exist → create user
    if (!user) {
      const clerkUser = await currentUser();

      if (!clerkUser || !clerkUser.emailAddresses?.length) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      const newUser = await prisma.user.create({
        data: {
          id: userId,
          email: clerkUser.emailAddresses[0].emailAddress,
          isSubscribed: false,
        },
      });

      return NextResponse.json({
        isSubscribed: newUser.isSubscribed,
        subscriptionEnds: newUser.subscriptionEnds,
      });
    }

    // Check if subscription expired
    const now = new Date();

    if (user.subscriptionEnds && user.subscriptionEnds < now) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isSubscribed: false,
          subscriptionEnds: null,
        },
      });

      return NextResponse.json({
        isSubscribed: false,
        subscriptionEnds: null,
      });
    }

    return NextResponse.json({
      isSubscribed: user.isSubscribed,
      subscriptionEnds: user.subscriptionEnds,
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

