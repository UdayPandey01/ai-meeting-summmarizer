"use client";
import { useState } from "react";
import axios from "axios";
import MeetingSummaries from "@/components/MeetingSummaries";
import EmailSummary from "@/components/EmailSummary";
import { useToast } from "@/components/ToastProvider";

// Helper function to format JSON summary as readable text
function formatSummaryAsText(summaryContent: any): string {
  if (summaryContent.raw) {
    return summaryContent.raw;
  }
  
  let text = "";
  if (summaryContent.highlights && Array.isArray(summaryContent.highlights)) {
    text += "Key Highlights:\n" + summaryContent.highlights.map((h: string) => `• ${h}`).join("\n") + "\n\n";
  }
  if (summaryContent.decisions && Array.isArray(summaryContent.decisions)) {
    text += "Decisions Made:\n" + summaryContent.decisions.map((d: string) => `• ${d}`).join("\n") + "\n\n";
  }
  if (summaryContent.actions && Array.isArray(summaryContent.actions)) {
    text += "Action Items:\n" + summaryContent.actions.map((a: string) => `• ${a}`).join("\n") + "\n\n";
  }
  if (summaryContent.notes && Array.isArray(summaryContent.notes)) {
    text += "Notes:\n" + summaryContent.notes.map((n: string) => `• ${n}`).join("\n") + "\n\n";
  }
  
  return text.trim() || "Summary generated successfully.";
}

export default function Home() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState(""); // Custom instruction/prompt
  const [generatedSummary, setGeneratedSummary] = useState<string>(""); // AI-generated summary
  const [summaryHtml, setSummaryHtml] = useState<string>(""); // HTML formatted summary for email
  const [loading, setLoading] = useState(false);

  const handleUploadAndSummarize = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("prompt", prompt); // send custom instruction

    const token = localStorage.getItem("token");
    setLoading(true);

    try {
      const res = await axios.post("/api/upload/upload-and-summarize", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // The AI-generated summary from the backend
      const meeting = res.data.meeting;
      const summaryContent = meeting?.summary?.content;
      
      // Set both text and HTML versions
      if (summaryContent) {
        // Create a readable text version from JSON
        const textSummary = formatSummaryAsText(summaryContent);
        setGeneratedSummary(textSummary);
      }
      
      // Set HTML version for email
      setSummaryHtml(res.data.summaryHtml || "");
      console.log("Upload and summarization successful:", res.data);

      // Notify and refresh meeting list
      toast("Meeting summary generated", "success");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("meetings:refresh"));
      }
      // Optionally clear form inputs
      setFile(null);
    } catch (error: any) {
      console.error("Upload failed:", error.response?.data || error.message);
      toast("Failed to generate summary", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">AI Meeting Summarizer</h1>

      <input
        type="text"
        placeholder="Meeting title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border p-2 rounded block mb-2 w-full"
      />

      <textarea
        placeholder="Enter custom instruction / prompt (e.g., summarize for executives)"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="border p-2 rounded block mb-2 w-full h-20"
      />

      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="block mb-2"
      />

      <button
        onClick={handleUploadAndSummarize}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
        disabled={loading}
      >
        {loading ? "Generating Summary..." : "Generate Summary"}
      </button>

      {generatedSummary && (
        <div className="border p-4 rounded bg-gray-50">
          <h2 className="font-semibold mb-2">Generated Summary (Editable)</h2>
          <textarea
            value={generatedSummary}
            onChange={(e) => setGeneratedSummary(e.target.value)}
            className="w-full h-64 border p-2 rounded"
          />
        </div>
      )}
      <EmailSummary summary={generatedSummary} summaryHtml={summaryHtml} />

      <MeetingSummaries />
    </div>
  );
}
