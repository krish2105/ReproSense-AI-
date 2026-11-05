"use client";

// Replaces the root layout when it fails, so no providers exist here: strings come straight from the message file.
import en from "../../messages/en.json";
import "./globals.css";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en" dir="ltr">
      <body>
        <main id="main" className="wrap view">
          <p style={{ marginBottom: 16 }}>
            <span className="fict fict-pill">{en.chrome.badge}</span>
          </p>
          <div className="state err" role="alert">
            <h1>{en.states.errorTitle}</h1>
            <p>{en.states.errorBody}</p>
            <button type="button" className="btn btn-o btn-sm" onClick={reset}>
              {en.states.retry}
            </button>
          </div>
        </main>
        <footer className="wrap">
          <p>{en.chrome.footer}</p>
        </footer>
      </body>
    </html>
  );
}
