"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <header className="border-b border-zinc-300 bg-stone-100/95">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-950 font-mono text-xs font-bold text-emerald-300">
            dm
          </div>
          <span className="text-xl font-black text-zinc-950">DevMegle</span>
        </Link>

        <div className="flex items-center gap-2 text-sm">
          <Link href="/dashboard" className="rounded-md px-3 py-2 font-semibold text-zinc-700 hover:bg-white">
            Dashboard
          </Link>
          {user ? (
            <button onClick={() => signOut()} className="rounded-md bg-zinc-950 px-3 py-2 font-bold text-white">
              Sign out
            </button>
          ) : (
            <Link href="/auth/signin" className="rounded-md bg-zinc-950 px-3 py-2 font-bold text-white">
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
