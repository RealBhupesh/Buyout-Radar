"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Glyph, Mark } from "./icons";
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to research
      </a>
      <aside className="sidebar">
        <Link href="/" className="brand" aria-label="Buyout Radar home">
          <Mark />
          <span>
            Buyout<span>Radar</span>
          </span>
        </Link>
        <p className="nav-caption">Research workspace</p>
        <nav aria-label="Primary navigation">
          {[
            { href: "/", label: "Radar", icon: "radar" as const },
            { href: "/pilot", label: "Filing pilot", icon: "book" as const },
            {
              href: "/watchlist",
              label: "Saved research",
              icon: "save" as const,
            },
            {
              href: "/methodology",
              label: "Methodology",
              icon: "book" as const,
            },
          ].map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={
                path === n.href ||
                (n.href === "/pilot" && path.startsWith("/pilot/")) ||
                (n.href === "/" && path.startsWith("/company/"))
                  ? "nav-link active"
                  : "nav-link"
              }
              aria-current={
                path === n.href ||
                (n.href === "/pilot" && path.startsWith("/pilot/")) ||
                (n.href === "/" && path.startsWith("/company/"))
                  ? "page"
                  : undefined
              }
            >
              <Glyph name={n.icon} />
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="small-mark">
            <Mark size={42} />
          </div>
          <p>
            A price is a number.
            <br />A buyout is a thesis.
          </p>
          <span>Built for the second look.</span>
          <a
            href="https://github.com/RealBhupesh/Buyout-Radar"
            target="_blank"
            rel="noreferrer"
          >
            View the source <Glyph name="arrow" size={14} />
          </a>
        </div>
      </aside>
      <div className="workspace">
        <div className="topbar">
          <span className="topbar-title">Indian mid-cap research</span>
          <span className="topbar-note">
            An underwriting lens, with every assumption exposed.
          </span>
        </div>
        <main id="main">{children}</main>
        <footer className="workspace-footer">
          <span>Buyout Radar · Research, with receipts.</span>
          <Link href="/methodology">
            Assumptions & provenance <Glyph name="arrow" size={13} />
          </Link>
        </footer>
      </div>
    </div>
  );
}
