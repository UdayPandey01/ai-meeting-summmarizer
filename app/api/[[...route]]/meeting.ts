// app/api/meetings/route.ts
import { Hono } from "hono";
import { jwtVerify, type JWTPayload } from "jose";
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
    let decoded: (JWTPayload & { id?: string }) | null = null;
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(JWT_SECRET)
      );
      decoded = payload as JWTPayload & { id?: string };
    } catch {
      return c.json({ error: "Invalid token" }, 401);
    }

    const ownerId = decoded?.id;
    if (!ownerId) return c.json({ error: "Invalid token payload" }, 401);

    const meetings = await prisma.meeting.findMany({
      where: { ownerId },
      include: { summary: true },
      orderBy: { createdAt: "desc" },
    });

    return c.json({ meetings });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (process.env.NODE_ENV !== "production") {
      console.error("Fetch meetings error:", err);
    }
    return c.json({ error: "Failed to fetch meetings", details: message }, 500);
  }
});

export default app;
