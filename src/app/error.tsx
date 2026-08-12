"use client";

import React, { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 text-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 border border-[#E2E8F0]">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
          ⚠️
        </div>
        <h2 className="text-2xl font-bold text-[#0F172A] mb-3">
          Oops! Something went wrong!
        </h2>
        <p className="text-slate-500 mb-6 text-sm">
          A critical error occurred while trying to render this page.
          <br /><br />
          <strong>Error Details:</strong> {error.message}
        </p>
        <button
          onClick={() => reset()}
          className="w-full bg-[#2EC4B6] hover:bg-[#25A99D] text-white font-bold py-3 px-6 rounded-xl transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
