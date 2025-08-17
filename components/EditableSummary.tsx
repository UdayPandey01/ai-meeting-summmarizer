"use client";
import { useState, useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface EditableSummaryProps {
  initialContent: string;
  onContentChange?: (content: string) => void;
}

export default function EditableSummary({ initialContent, onContentChange }: EditableSummaryProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onContentChange?.(html);
    },
  });

  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  return (
    <div className="border rounded">
      <EditorContent 
        editor={editor} 
        className="p-4 min-h-[200px] prose max-w-none focus-within:ring-2 focus-within:ring-blue-500" 
      />
    </div>
  );
}
