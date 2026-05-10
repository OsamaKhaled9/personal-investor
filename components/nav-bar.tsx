"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, TrendingUp, Moon, Target, Activity, type LucideIcon } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

type Pillar = { href: string; label: string; Icon: LucideIcon };

const PILLARS: Pillar[] = [
  { href: "/",        label: "Hub",     Icon: LayoutDashboard },
  { href: "/wealth",  label: "Wealth",  Icon: TrendingUp },
  { href: "/worship", label: "Worship", Icon: Moon },
  { href: "/life",    label: "Life",    Icon: Target },
  { href: "/health",  label: "Health",  Icon: Activity },
];

function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function Logo() {
  return (
    <Link href="/" className="flex flex-col items-start leading-none select-none group">
      <span
        className="text-[13px] text-gold-gradient group-hover:opacity-80 transition-opacity"
        style={{ fontFamily: "var(--font-azal-display)", direction: "rtl" }}
      >
        حياتي
      </span>
      <span
        className="font-mono text-[5px] tracking-[0.28em] uppercase"
        style={{ color: "var(--hayati-sand-500)", opacity: 0.7, letterSpacing: "0.28em", fontFamily: "var(--font-ibm-plex-sans, var(--font-geist-sans))" }}
      >
        HAYATI
      </span>
    </Link>
  );
}

export function NavBar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop — sticky top header */}
      <header className="hidden md:block sticky top-0 z-50 border-b backdrop-blur-md" style={{ background: "var(--nav-bg)", borderColor: "var(--border)" }}>
        <div className="container mx-auto px-4 max-w-7xl flex items-center justify-between h-14">
          <Logo />

          <nav className="flex items-center gap-0.5">
            {PILLARS.map((pillar) => {
              const active = isActive(pillar.href, pathname);
              return (
                <Link
                  key={pillar.href}
                  href={pillar.href}
                  className="relative px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-11 flex items-center gap-1.5"
                  style={{ color: active ? "var(--nav-active-color)" : "var(--foreground-muted)" }}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-md"
                      style={{ background: "var(--nav-active-bg)" }}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    <pillar.Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
                    <span className="hidden lg:inline">{pillar.label}</span>
                  </span>
                </Link>
              );
            })}
          </nav>

          <ThemeToggle />
        </div>
      </header>

      {/* Mobile — fixed bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-md"
        style={{ background: "var(--nav-bg)", borderColor: "var(--border)", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-stretch h-16">
          {PILLARS.map((pillar) => {
            const active = isActive(pillar.href, pathname);
            return (
              <Link
                key={pillar.href}
                href={pillar.href}
                className="relative flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
                style={{ color: active ? "var(--nav-active-color)" : "var(--foreground-muted)" }}
              >
                {active && (
                  <motion.span
                    layoutId="bottom-pill"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{ background: "var(--hayati-gold-400)" }}
                    transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
                  />
                )}
                <pillar.Icon size={22} strokeWidth={active ? 2.2 : 1.6} />
                <span className="text-[10px] font-medium">{pillar.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
