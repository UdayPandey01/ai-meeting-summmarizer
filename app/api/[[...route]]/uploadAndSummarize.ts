import { Hono } from "hono";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";
import { geminiModel } from "@/lib/gemini";
import mammoth from "mammoth";
import { PDFDocument } from "pdf-lib";

const JWT_SECRET = process.env.JWT_SECRET || "gbmbubm7tgv";
const app = new Hono();

app.post("/upload-and-summarize", async (c) => {
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

    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const promptText = (formData.get("prompt") as string) || "";
    if (!file || !title)
      return c.json({ error: "Title and file required" }, 400);

    const buffer = Buffer.from(await file.arrayBuffer());
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
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
      fileType = "DOCX";
    } else {
      return c.json({ error: "Unsupported file type" }, 400);
    }

    const prompt = `
You are an AI meeting assistant. Summarize the following meeting transcript clearly and concisely.
${promptText ? `Custom instruction: ${promptText}` : ""}

Format the summary as a professional email-ready HTML document with the following structure:
1. Meeting Title: ${title}
2. Key Highlights: (list the most important points)
3. Decisions Made: (list any decisions)
4. Action Items: (who needs to do what)
5. Notes: (optional important notes)

Transcript:
${extractedText}

Provide the summary as both JSON and HTML formats in this structure:
{
  "json": {
    "highlights": ["point1", "point2"],
    "decisions": ["decision1", "decision2"],
    "actions": ["action1", "action2"],
    "notes": ["note1", "note2"]
  },
  "html": "<div>...formatted HTML content...</div>"
}
`;

    const genResult = await geminiModel.generateContent(prompt);
    console.log("📝 Gemini raw response:", genResult);

    const summaryText = await genResult.response.text();
    console.log("📝 Gemini summary text:", summaryText);

    let summaryJson: any = {};
    let summaryHtml: string = "";
    try {
      let cleanText = summaryText.trim();
      if (cleanText.startsWith("```")) {
        const match = cleanText.match(/```(?:json)?\n([\s\S]*?)```/i);
        if (match && match[1]) cleanText = match[1].trim();
      }
      const parsed = JSON.parse(cleanText);
      summaryJson = parsed.json || parsed;
      summaryHtml =
        parsed.html || generateHtmlFromJson(parsed.json || parsed, title);
    } catch (err) {
      console.warn(
        "⚠️ Failed to parse Gemini response as JSON, generating fallback HTML:",
        err
      );
      summaryJson = { raw: summaryText };
      summaryHtml = `<div><h2>${title}</h2><p>${summaryText}</p></div>`;
    }

    function generateHtmlFromJson(json: any, meetingTitle: string): string {
      const highlights = Array.isArray(json.highlights) ? json.highlights : [];
      const decisions = Array.isArray(json.decisions) ? json.decisions : [];
      const actions = Array.isArray(json.actions) ? json.actions : [];
      const notes = Array.isArray(json.notes) ? json.notes : [];

      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">${meetingTitle}</h1>
          
          ${
            highlights.length > 0
              ? `
          <h2 style="color: #007bff; margin-top: 30px;">📋 Key Highlights</h2>
          <ul style="line-height: 1.6;">
            ${highlights.map((h: any) => `<li>${h}</li>`).join("")}
          </ul>
          `
              : ""
          }
          
          ${
            decisions.length > 0
              ? `
          <h2 style="color: #007bff; margin-top: 30px;">✅ Decisions Made</h2>
          <ul style="line-height: 1.6;">
            ${decisions.map((d: any) => `<li>${d}</li>`).join("")}
          </ul>
          `
              : ""
          }
          
          ${
            actions.length > 0
              ? `
          <h2 style="color: #007bff; margin-top: 30px;">🎯 Action Items</h2>
          <ul style="line-height: 1.6;">
            ${actions.map((a: any ) => `<li>${a}</li>`).join("")}
          </ul>
          `
              : ""
          }
          
          ${
            notes.length > 0
              ? `
          <h2 style="color: #007bff; margin-top: 30px;">📝 Notes</h2>
          <ul style="line-height: 1.6;">
            ${notes.map((n: any) => `<li>${n}</li>`).join("")}
          </ul>
          `
              : ""
          }
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px; text-align: center;">Generated by AI Meeting Summarizer</p>
        </div>
      `;
    }

    const meeting = await prisma.meeting.create({
      data: {
        title,
        originalContent: extractedText,
        fileType,
        owner: { connect: { id: ownerId } },
        summary: {
          create: { content: summaryJson, status: "COMPLETED" },
        },
      },
      include: { summary: true },
    });

    return c.json({ success: true, meeting, summaryHtml });
  } catch (err: any) {
    console.error("Upload & summarize error:", err);
    return c.json({ error: "Failed", details: err.message }, 500);
  }
});

export default app;
