"use client";

import { useEffect } from "react";

const styles = `
  body { margin: 0; background: #241a12; color: #fbf7f0; font-family: Georgia, 'Times New Roman', serif; }
  main { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; text-align: center; padding: 2rem; }
  .mark { font-size: 2.5rem; }
  h1 { font-size: 2rem; font-weight: 400; margin: 0; }
  p { margin: 0; color: #d8c7b4; font-size: 0.9rem; line-height: 1.8; max-width: 46ch; }
  .row { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.75rem; }
  a { display: inline-block; padding: 0.6rem 1.5rem; border: 1px solid rgba(245, 234, 217, 0.45); border-radius: 999px; color: #fbf7f0; text-decoration: none; }
  button { padding: 0.6rem 1.5rem; border: 0; border-radius: 999px; background: #f5ead9; color: #241a12; font-size: 0.72rem; letter-spacing: 0.14em; text-transform: uppercase; cursor: pointer; }
`;

/**
 * The error boundary for everything outside the [locale] segment, and inside
 * it when the layout itself throws. No providers or locale data exist here,
 * so the copy is hardcoded bilingual and the page renders its own shell.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error", error);
  }, [error]);

  return (
    <html lang="en" dir="ltr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <title>Mazzaق — مزاق</title>
        <style>{styles}</style>
      </head>
      <body>
        <main>
          <span className="mark" role="img" aria-label="Mazzaق">
            ✳
          </span>
          <h1>Mazzaق</h1>
          <p>
            The kitchen hit a snag. Something went wrong on our side.
            <br />
            تعثر المطبخ قليلاً. حدث خطأ من جانبنا.
          </p>
          {error.digest ? (
            <p dir="ltr" style={{ fontSize: "0.72rem", color: "#8f7f71" }}>
              Ref {error.digest}
            </p>
          ) : null}
          <div className="row">
            <button type="button" onClick={() => reset()}>
              Try again · حاول
            </button>
            <a href="/en">Store · المتجر</a>
          </div>
        </main>
      </body>
    </html>
  );
}
