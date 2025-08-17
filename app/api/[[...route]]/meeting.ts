// app/api/meetings/route.ts
import { Hono } from "hono";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "gbmbubm7tgv";
const app = new Hono();

app.get("/", async (c) => {
  try {
    const authHeader = c.req.header("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.split(" ")[1];
    let decoded: any;
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(JWT_SECRET)
      );
      decoded = payload;
    } catch {
      return c.json({ error: "Invalid token" }, 401);
    }

    const ownerId = decoded.id;

    const meetings = await prisma.meeting.findMany({
      where: { ownerId },
      include: { summary: true },
      orderBy: { createdAt: "desc" },
    });

    return c.json({ meetings });
  } catch (err: any) {
    console.error("Fetch meetings error:", err);
    return c.json({ error: "Failed to fetch meetings", details: err.message }, 500);
  }
});

export default app;
