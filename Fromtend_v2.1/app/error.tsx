"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-4">
      <ErrorState
        title="Something went wrong"
        message={error.message || "An unexpected error occurred."}
        onRetry={reset}
      />
    </div>
  );
}
