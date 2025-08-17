import { Hono } from "hono";
import { jwtVerify } from "jose";
import { PrismaClient } from "@/lib/generated/prisma";
import { PDFDocument } from "pdf-lib";
import mammoth from "mammoth";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "gbmbubm7tgv";

const uploadRoute = new Hono();

uploadRoute.post("/upload", async (c) => {
  try {
    const authHeader = c.req.header("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.split(" ")[1];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    const ownerId = decoded.id as string;

    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;

    if (!file) {
      return c.json({ error: "No file uploaded" }, 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let extractedText = "";
    let fileType: "TXT" | "DOCX" | "PDF" = "TXT";

    if (file.name.endsWith(".txt")) {
      extractedText = buffer.toString("utf-8");
      fileType = "TXT";
    } else if (file.name.endsWith(".pdf")) {
      const pdfDoc = await PDFDocument.load(buffer);
      const pageCount = pdfDoc.getPageCount();

      extractedText = `PDF with ${pageCount} pages (text extraction not implemented).`;
      fileType = "PDF";
    } else if (file.name.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer: buffer });
      extractedText = result.value;
      fileType = "DOCX";
    } else {
      return c.json({ error: "Unsupported file type" }, 400);
    }

    const meeting = await prisma.meeting.create({
      data: {
        title,
        originalContent: extractedText,
        fileType,
        ownerId,
      },
    });

    return c.json({ success: true, meeting });
  } catch (err) {
  console.error("Upload error:", err);

  return c.json(
    { error: "Upload failed", details: (err as Error).message },
    500
  );
}
});

export default uploadRoute;
