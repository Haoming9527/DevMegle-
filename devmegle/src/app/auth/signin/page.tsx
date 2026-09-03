"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/lib/auth";

export default function SignInPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await signIn(email, password);
    } catch {
      setError("Unable to sign in with those credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-100 text-zinc-950">
      <Navbar />
      <section className="mx-auto flex max-w-xl items-center px-4 py-12 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="w-full bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">identity</p>
          <h1 className="mt-2 text-3xl font-black">Sign in</h1>
          {error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <label className="mt-5 block">
            <span className="text-sm font-semibold text-zinc-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="mt-2 w-full rounded-md border border-zinc-300 bg-stone-50 px-3 py-3 outline-none focus:border-emerald-500"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-semibold text-zinc-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              className="mt-2 w-full rounded-md border border-zinc-300 bg-stone-50 px-3 py-3 outline-none focus:border-emerald-500"
            />
          </label>

          <button
            disabled={isLoading}
            className="mt-6 w-full rounded-md bg-zinc-950 px-4 py-3 font-bold text-white disabled:opacity-60"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>

          <p className="mt-4 text-sm text-zinc-600">
            New here?{" "}
            <Link href="/auth/signup" className="font-semibold text-emerald-700">
              Create a handle
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
