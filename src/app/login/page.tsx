"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [nextPath, setNextPath] = useState("/");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const raw = search.get("next");
    const parsed = raw && raw.startsWith("/") ? raw : "/";
    setNextPath(parsed);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseBrowserClient();

    void supabase.auth.getUser().then(({ data }) => {
      if (!cancelled && data.user) {
        router.replace(nextPath);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [nextPath, router]);

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      router.replace(nextPath);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/login` },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (!data.session) {
        setStatus("Account created. Check your email to confirm your account, then sign in.");
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f8f8f7",
        padding: 20,
      }}
    >
      <form
        onSubmit={handleSignIn}
        style={{
          width: "100%",
          maxWidth: 420,
          display: "grid",
          gap: 14,
          background: "#fff",
          border: "1px solid #ddd",
          borderRadius: 14,
          padding: 22,
          boxShadow: "0 8px 24px -16px rgba(0,0,0,0.25)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 24 }}>Sign in to Throughline</h1>
        <p style={{ margin: 0, opacity: 0.7 }}>Use Supabase Auth credentials to access your journal.</p>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
            style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc" }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
            placeholder="Your password"
            style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc" }}
          />
        </label>

        {error ? <p style={{ margin: 0, color: "#b00020" }}>{error}</p> : null}
        {status ? <p style={{ margin: 0, color: "#14532d" }}>{status}</p> : null}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "11px 14px",
            borderRadius: 8,
            border: "1px solid #111",
            background: "#111",
            color: "#fff",
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? "Working..." : "Sign in"}
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={handleSignUp}
          style={{
            padding: "11px 14px",
            borderRadius: 8,
            border: "1px solid #bbb",
            background: "#fff",
            color: "#111",
            cursor: loading ? "wait" : "pointer",
          }}
        >
          Create account
        </button>
      </form>
    </main>
  );
}
