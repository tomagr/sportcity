import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { uploadAvatarToS3 } from "@/lib/s3";
import { verifySessionFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const session = await verifySessionFromRequest(req);
    if (!session) {
      console.log("LOG =====> Unauthorized avatar upload: no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const requestUrl = new URL(req.url);
    const segments = requestUrl.pathname.split("/").filter(Boolean);
    // Expected [..., 'users', '{id}', 'avatar']
    const usersIdx = segments.indexOf("users");
    const userId = usersIdx >= 0 && segments.length > usersIdx + 1 ? segments[usersIdx + 1] : "";
    if (!userId) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }
    if (session.userId !== userId && !session.isAdmin) {
      console.log("LOG =====> Forbidden avatar upload for different user");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const avatarUrl = await uploadAvatarToS3({
      userId,
      contentType: file.type || "application/octet-stream",
      body: buffer,
      filename: file.name || "avatar",
    });

    const [updated] = await db
      .update(users)
      .set({ avatarUrl })
      .where(eq(users.id, userId))
      .returning({ email: users.email, avatarUrl: users.avatarUrl });
    console.log(`LOG =====> Avatar uploaded for user ${updated?.email}`);
    return NextResponse.json({ avatarUrl: updated?.avatarUrl });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`LOG =====> Avatar upload error: ${message}`);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}


