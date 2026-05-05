"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { href: "/", label: "Portfolio", icon: "💼" },
  { href: "/market", label: "Market", icon: "📊" },
  { href: "/chat", label: "AI Analyst", icon: "🧠" },
  { href: "/alerts", label: "Alerts", icon: "🔔" },
];

export function NavBar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md">
      <div className="container mx-auto px-4 max-w-7xl flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
          <span className="text-lg">☪️</span>
          <span className="hidden sm:inline text-sm font-mono text-[var(--foreground-muted)]">Personal Investor</span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                style={{ color: active ? "var(--foreground)" : "var(--foreground-muted)" }}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-md bg-[var(--surface-elevated)]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="relative flex items-center gap-1.5">
                  <span className="text-base leading-none">{item.icon}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
