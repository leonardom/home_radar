"use client";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    // Optionally log error
    // console.error(error);
  }, [error]);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-2">Something went wrong</h1>
      <p className="text-muted-foreground mb-6">An unexpected error occurred. Please try again.</p>
      <button className="text-primary underline" onClick={() => reset()}>
        Try again
      </button>
    </main>
  );
}
