import type { Metadata } from "next";
import NextLink from "next/link";

export const metadata: Metadata = {
  title: "Mazzaق — مزاق",
  robots: { index: false, follow: false },
};

const styles = `
  body { margin: 0; background: #241a12; color: #fbf7f0; font-family: Georgia, 'Times New Roman', serif; }
  main { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; text-align: center; padding: 2rem; }
  .mark { font-size: 2.5rem; color: #f5c36b; }
  .mark-ar { font-size: 1.1rem; letter-spacing: 0.3em; margin-top: -0.25rem; }
  h1 { font-size: 2rem; font-weight: 400; margin: 0; }
  p { margin: 0; color: #d8c7b4; font-size: 0.9rem; line-height: 1.8; max-width: 46ch; }
  .row { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.75rem; }
  a { display: inline-block; padding: 0.6rem 1.5rem; border: 1px solid rgba(245, 234, 217, 0.45); border-radius: 999px; color: #fbf7f0; text-decoration: none; font-size: 0.72rem; letter-spacing: 0.14em; text-transform: uppercase; }
  a.primary { background: #f5ead9; border-color: transparent; color: #241a12; }
`;

/**
 * The 404 for unmatched URLs outside the [locale] segment. Renders its own
 * document because no root layout exists in this app.
 */
export default function GlobalNotFound() {
  return (
    <html lang="en" dir="ltr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <style>{styles}</style>
      </head>
      <body>
        <main>
          <span className="mark" aria-hidden>
            ✳
          </span>
          <h1>Mazzaق</h1>
          <p className="mark-ar">مزاق</p>
          <p>
            That page doesn&apos;t exist. The pastry case is still open.
            <br />
            هذه الصفحة غير موجودة. الفاترينة ما زالت مفتوحة.
          </p>
          <div className="row">
            <NextLink className="primary" href="/en">
              English
            </NextLink>
            <NextLink href="/ar">العربية</NextLink>
          </div>
        </main>
      </body>
    </html>
  );
}
