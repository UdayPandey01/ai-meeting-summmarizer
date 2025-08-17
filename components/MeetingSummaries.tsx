"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";

type ActionItem = string | Record<string, string>;
type SummaryJSON = {
  raw?: string;
  highlights?: string[];
  decisions?: string[];
  actions?: ActionItem[];
  notes?: string[];
};

interface Summary {
  content: SummaryJSON;
  status: string;
}

interface Meeting {
  id: string;
  title: string;
  originalContent: string;
  fileType: string;
  createdAt: string;
  summary?: Summary;
}

export default function MeetingSummaries() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMeetings = useCallback(async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("/api/meetings/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMeetings(res.data.meetings);
    } catch (err) {
      console.error("Failed to fetch meetings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
    const onRefresh = () => {
      setLoading(true);
      fetchMeetings();
    };
    window.addEventListener("meetings:refresh", onRefresh);
    return () => window.removeEventListener("meetings:refresh", onRefresh);
  }, [fetchMeetings]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-3"></div>
        <span className="text-lg text-gray-600">Loading meetings...</span>
      </div>
    );

  if (meetings.length === 0)
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <svg
          className="w-12 h-12 text-gray-400 mb-2"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 17l4 4 4-4m-4-5v9"
          ></path>
        </svg>
        <p className="text-gray-500 text-lg">No meetings found.</p>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold mb-6 text-blue-700">
        My Meeting Summaries
      </h1>
      <div className="space-y-8">
        {meetings.map((meeting) => (
          <div
            key={meeting.id}
            className="border rounded-xl p-6 shadow-md bg-gradient-to-br from-white to-blue-50 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-semibold text-gray-800">
                {meeting.title}
              </h2>
              <span className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-700 font-medium">
                {meeting.fileType.toUpperCase()}
              </span>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              {new Date(meeting.createdAt).toLocaleString()}
            </p>

            <details className="mb-4">
              <summary className="cursor-pointer text-blue-600 font-semibold">
                Show Original Content
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded text-gray-700 text-sm whitespace-pre-wrap">
                {meeting.originalContent}
              </div>
            </details>

            {meeting.summary ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {meeting.summary.content.raw ? (
                  <div className="border-l-4 border-blue-500 bg-white p-4 rounded shadow-sm hover:shadow-md transition-shadow col-span-2">
                    <h3 className="text-blue-700 font-semibold mb-2">
                      Summary
                    </h3>
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {meeting.summary?.content?.raw}
                    </p>
                  </div>
                ) : (
                  ["highlights", "decisions", "actions", "notes"].map((key) => {
                    const content = meeting.summary?.content?.[key as keyof SummaryJSON];
                    if (
                      !content ||
                      (Array.isArray(content) && content.length === 0)
                    )
                      return null;
                    return (
                      <div
                        key={key}
                        className="border-l-4 border-blue-500 bg-white p-4 rounded shadow-sm hover:shadow-md transition-shadow"
                      >
                        <h3 className="text-blue-700 font-semibold capitalize mb-2">
                          {key === "actions" ? "Action Items" : key}
                        </h3>
                        {Array.isArray(content) ? (
                          <ul className="list-disc ml-5 space-y-1 text-gray-800">
                            {content.map((item: ActionItem, idx: number) => (
                              <li key={idx}>
                                {typeof item === "string"
                                  ? item
                                  : Object.entries(item)
                                      .map(
                                        ([k, v]) =>
                                          `${
                                            k === "who"
                                              ? "Owner"
                                              : k === "what"
                                              ? "Task"
                                              : k
                                          }: ${v}`
                                      )
                                      .join(", ")}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-800 whitespace-pre-wrap">
                            {content}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <p className="text-gray-400 italic mt-2">No summary yet.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
