"use client";
import Link from "next/link";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="error-page">
      <h1>
        The research desk
        <br />
        is taking a moment.
      </h1>
      <p>
        The data could not be loaded. Your saved research remains in this
        browser. Retry the connection or return to Radar.
      </p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
      <Link className="text-button" href="/">
        Return to Radar
      </Link>
    </div>
  );
}
