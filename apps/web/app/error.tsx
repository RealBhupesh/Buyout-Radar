"use client";
import Link from "next/link";
export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <div className="error-page">
      <h1>Research data unavailable</h1>
      <p>Your saved research is still in this browser.</p>
      <button className="button primary" onClick={() => retry()}>
        Try again
      </button>
      <Link className="text-button" href="/">
        Return to Radar
      </Link>
    </div>
  );
}
