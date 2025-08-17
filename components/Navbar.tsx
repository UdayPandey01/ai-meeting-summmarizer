"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [isAuthed, setIsAuthed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    setIsAuthed(!!token);
    const onStorage = () => setIsAuthed(!!localStorage.getItem("token"));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    setIsAuthed(false);
    router.push("/sign-up");
  };

  return (
    <nav className="w-full border-b bg-white/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold text-gray-800 hover:text-blue-600">
            AI Meeting Summarizer
          </Link>
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            Homepage
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {isAuthed ? (
            <button
              onClick={handleSignOut}
              className="text-sm px-3 py-1.5 rounded bg-gray-800 text-white hover:bg-gray-700"
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/sign-up"
              className="text-sm px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Sign up
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
