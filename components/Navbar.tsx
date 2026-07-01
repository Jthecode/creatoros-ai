"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Marketplace", href: "/marketplace" },
  { name: "Pricing", href: "/pricing" },
  { name: "AI Builder", href: "/ai-builder" },
  { name: "Dashboard", href: "/dashboard" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 font-bold text-black">
            C
          </div>

          <div>
            <h1 className="text-lg font-bold text-white">
              CreatorOS AI
            </h1>
            <p className="text-xs text-zinc-400">
              AI Operating System
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          {navigation.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`transition ${
                  active
                    ? "text-yellow-400"
                    : "text-zinc-300 hover:text-white"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Side */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="text-zinc-300 hover:text-white"
          >
            Login
          </Link>

          <Link
            href="/signup"
            className="rounded-xl bg-yellow-400 px-5 py-2 font-semibold text-black transition hover:bg-yellow-300"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-white md:hidden"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-white/10 bg-black md:hidden">
          <div className="flex flex-col px-6 py-4">

            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="py-3 text-zinc-300 hover:text-white"
              >
                {item.name}
              </Link>
            ))}

            <div className="mt-4 flex flex-col gap-3">
              <Link
                href="/login"
                className="rounded-lg border border-white/10 py-2 text-center text-white"
              >
                Login
              </Link>

              <Link
                href="/signup"
                className="rounded-lg bg-yellow-400 py-2 text-center font-semibold text-black"
              >
                Get Started
              </Link>
            </div>

          </div>
        </div>
      )}
    </header>
  );
}