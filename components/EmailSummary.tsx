import React, { useState } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import { useToast } from "@/components/ToastProvider";

const EditableSummary = dynamic(() => import("./EditableSummary"), { ssr: false });

export default function EmailSummary({ summary, summaryHtml }: { summary: string; summaryHtml: string }) {
  const { toast } = useToast();
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("Meeting Summary");
  const [emailContent, setEmailContent] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSending, setIsSending] = useState(false);

  React.useEffect(() => {
    if (summaryHtml && !emailContent) {
      setEmailContent(summaryHtml);
    }
  }, [summaryHtml, emailContent]);

  const handleSendEmail = async () => {
    if (!recipient || !subject || !emailContent) {
      toast("Please fill in recipient, subject and content", "error");
      return;
    }

    setIsSending(true);
    try {
      await axios.post("/api/send-email", { 
        to: recipient, 
        subject, 
        html: emailContent 
      });
      toast("Email sent successfully", "success");
      setIsPreviewMode(true);
      setRecipient("");
    } catch (error) {
      console.error("Failed to send email:", error);
      toast("Failed to send email. Please try again", "error");
    } finally {
      setIsSending(false);
    }
  };

  const handleContentChange = (content: string) => {
    setEmailContent(content);
  };

  if (!summaryHtml && !summary) {
    return null;
  }

  return (
    <div className="mt-6 p-4 border rounded-lg bg-gray-50">
      <h2 className="text-xl font-semibold mb-4">📧 Email Summary</h2>
      
      <div className="space-y-3 mb-4">
        <input
          type="email"
          placeholder="Recipient email address"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          className="border p-3 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <input
          type="text"
          placeholder="Email subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="border p-3 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="mb-4">
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setIsPreviewMode(false)}
            className={`px-3 py-1 rounded text-sm ${
              !isPreviewMode ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Edit
          </button>
          <button
            onClick={() => setIsPreviewMode(true)}
            className={`px-3 py-1 rounded text-sm ${
              isPreviewMode ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Preview
          </button>
        </div>
        
        {isPreviewMode ? (
          <div 
            className="border p-4 rounded bg-white min-h-[200px]"
            dangerouslySetInnerHTML={{ __html: emailContent }}
          />
        ) : (
          <EditableSummary 
            initialContent={emailContent} 
            onContentChange={handleContentChange}
          />
        )}
      </div>

      <button 
        onClick={handleSendEmail} 
        disabled={isSending || !recipient || !subject}
        className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isSending ? "Sending..." : "Send Email"}
      </button>
    </div>
  );
}
