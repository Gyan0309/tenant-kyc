"use client";

// Catches errors in the root layout itself. Must render its own <html>/<body>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
          background: "#0f1115",
          color: "#fff",
        }}
      >
        <div style={{ maxWidth: 420, padding: 32, textAlign: "center" }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
            This screen could not be started
          </h1>
          <p style={{ marginTop: 8, fontSize: 14, color: "#9aa0ac" }}>
            {error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 24,
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: "#2f6fd6",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
