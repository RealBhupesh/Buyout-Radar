"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Glyph, Mark } from "./icons";
import { PanelDialog } from "./dialog";
const destinations = [
  { href: "/", label: "Opportunity radar", icon: "radar" as const },
  { href: "/pilot", label: "Filing pilot", icon: "book" as const },
  { href: "/watchlist", label: "Saved research", icon: "save" as const },
  { href: "/methodology", label: "Methodology", icon: "book" as const },
];
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [menu, setMenu] = useState(false);
  const nav = (mobile = false) => (
    <nav aria-label={mobile ? "Mobile navigation" : "Primary navigation"}>
      {destinations.map((n) => {
        const active =
          path === n.href ||
          (n.href === "/pilot" && path.startsWith("/pilot/")) ||
          (n.href === "/" &&
            (path.startsWith("/company/") || path === "/compare"));
        return (
          <Link
            key={n.href}
            href={n.href}
            className={`nav-link${active ? " active" : ""}`}
            aria-current={active ? "page" : undefined}
            onClick={() => setMenu(false)}
          >
            <Glyph name={n.icon} size={17} />
            <span>{n.label}</span>
          </Link>
        );
      })}
    </nav>
  );
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to research
      </a>
      <aside className="sidebar">
        <Link href="/" className="brand" aria-label="Buyout Radar home">
          <Mark size={27} />
          <span>Buyout Radar</span>
        </Link>
        <div className="workspace-identity">
          <strong>Acquisition research</strong>
          <span>India · INR crore</span>
        </div>
        <p className="nav-caption">Research workspace</p>
        {nav()}
        <div className="sidebar-bottom">
          <p>Private research</p>
          <span>Saved in this browser.</span>
          <Link href="/watchlist">
            Notes, diligence & backups <Glyph name="arrow" size={13} />
          </Link>
          <a
            href="https://github.com/RealBhupesh/Buyout-Radar"
            target="_blank"
            rel="noreferrer"
          >
            Source repository <Glyph name="arrow" size={13} />
          </a>
        </div>
      </aside>
      <div className="workspace">
        <header className="mobile-workspace-bar">
          <Link href="/" className="brand" aria-label="Buyout Radar home">
            <Mark size={24} />
            <span>Buyout Radar</span>
          </Link>
          <PanelDialog
            title="Workspace navigation"
            description="Buyout Radar acquisition research. India, INR crore."
            open={menu}
            onOpenChange={setMenu}
            trigger={<button className="button tonal">Menu</button>}
          >
            {nav(true)}
          </PanelDialog>
        </header>
        <main id="main">{children}</main>
        <footer className="workspace-footer">
          <span>Buyout Radar · India · INR crore</span>
          <Link href="/methodology">
            Assumptions & provenance <Glyph name="arrow" size={13} />
          </Link>
        </footer>
      </div>
    </div>
  );
}
