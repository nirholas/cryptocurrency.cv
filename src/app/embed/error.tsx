"use client";

export default function EmbedError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "2rem 1rem",
          background: "#0f172a",
          color: "#e2e8f0",
        }}
      >
        <p style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>
          Widget failed to load.
        </p>
        <button
          onClick={reset}
          style={{
            padding: "0.5rem 1rem",
            background: "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontSize: "0.75rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </body>
    </html>
  );
}
