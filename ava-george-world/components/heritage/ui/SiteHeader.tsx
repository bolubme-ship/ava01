"use client";

import { useState } from "react";

/*
 * Site header over the 3D scene: logo, primary navigation and utility icons.
 * Destinations other than the Heritage Collection don't exist yet, so those
 * links are placeholders ("#") to be wired to real routes.
 */

const NAV_LINKS = [
  { label: "Shop", href: "#" },
  { label: "Our World", href: "#" },
  { label: "The Heritage Collection", href: "#top" },
];

/** Interim wordmark until the official logo file is supplied (see ASSETS.md). */
const LOGO_LETTERS: [string, string][][] = [
  [
    ["A", "#e8412c"],
    ["V", "#f39a1e"],
    ["A", "#2fa84f"],
    ["&", "#2a8fd6"],
  ],
  [
    ["G", "#8cc63f"],
    ["E", "#f7a823"],
    ["O", "#ec407a"],
    ["R", "#29a3dc"],
    ["G", "#f15a29"],
    ["E", "#ffcd38"],
  ],
];

export function Logo() {
  return (
    <a
      href="#top"
      aria-label="Ava & George home"
      className="block font-logo text-[1.7rem] leading-[0.86] font-bold tracking-tight drop-shadow-[0_2px_6px_rgba(42,23,12,0.35)] sm:text-[2.1rem]"
    >
      {LOGO_LETTERS.map((line, i) => (
        <span key={i} className="block" aria-hidden="true">
          {line.map(([ch, color], j) => (
            <span key={j} style={{ color }}>
              {ch}
            </span>
          ))}
        </span>
      ))}
    </a>
  );
}

function Icon({ path, label }: { path: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="relative grid size-11 place-items-center rounded-full text-[#fffaf2] transition-colors hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
    >
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        {path}
      </svg>
    </button>
  );
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-30 bg-gradient-to-b from-[#2a170c]/35 to-transparent">
      <div className="mx-auto flex h-20 items-center justify-between gap-6 px-4 sm:h-24 sm:px-10 lg:px-16">
        <Logo />

        <nav aria-label="Primary" className="hidden items-center gap-10 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="group relative font-display text-[0.95rem] tracking-[0.14em] text-[#fffaf2] uppercase drop-shadow-[0_1px_4px_rgba(42,23,12,0.45)]"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-current transition-transform duration-300 group-hover:scale-x-100" />
            </a>
          ))}
          <button
            type="button"
            className="flex items-center gap-2 font-display text-[0.95rem] tracking-[0.14em] text-[#fffaf2] uppercase drop-shadow-[0_1px_4px_rgba(42,23,12,0.45)]"
          >
            More
            <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path d="M2.5 4.5 6 8l3.5-3.5" />
            </svg>
          </button>
        </nav>

        <div className="flex items-center gap-1 sm:gap-3">
          <span className="hidden sm:contents">
            <Icon
              label="Search"
              path={
                <>
                  <circle cx="10.5" cy="10.5" r="6.5" />
                  <path d="m15.5 15.5 5 5" />
                </>
              }
            />
            <Icon
              label="Account"
              path={
                <>
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />
                </>
              }
            />
          </span>
          <div className="relative">
            <Icon
              label="Shopping bag, 0 items"
              path={
                <>
                  <path d="M5 8h14l-1 12.5H6L5 8Z" />
                  <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
                </>
              }
            />
            <span className="pointer-events-none absolute top-0.5 right-0.5 grid size-5 place-items-center rounded-full bg-[#e3207a] text-[10px] font-semibold text-white">
              0
            </span>
          </div>
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="grid size-11 place-items-center rounded-full text-[#fffaf2] hover:bg-white/15 lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              {menuOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav aria-label="Primary" className="mx-4 rounded-2xl bg-[#2a170c]/85 p-6 backdrop-blur-md lg:hidden">
          <ul className="flex flex-col gap-5">
            {[...NAV_LINKS, { label: "More", href: "#" }].map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="font-display text-lg tracking-[0.14em] text-[#fffaf2] uppercase"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
