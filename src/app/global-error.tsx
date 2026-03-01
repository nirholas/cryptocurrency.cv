"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", textAlign: "center", padding: "4rem 1rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "1rem" }}>
          Something went wrong
        </h1>
        <p style={{ color: "#666", marginBottom: "2rem" }}>
          An unexpected error occurred.
        </p>
        <button
          onClick={reset}
          style={{
            padding: "0.75rem 1.5rem",
            background: "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
