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
    <main style={styles.main}>
      <div style={styles.card}>
        {/* Wordmark */}
        <div style={styles.brand}>
          <span style={styles.brandGlyph}>t</span>
          <span style={styles.brandName}>through<em style={styles.brandEm}>line</em></span>
        </div>

        <p style={styles.subtitle}>
          A journal for the line through your life.
        </p>

        <form onSubmit={handleSignIn} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.fieldLabel}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              style={styles.input}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#3898ec";
                e.currentTarget.style.boxShadow = "#3898ec 0px 0px 0px 1px";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e8e6dc";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.fieldLabel}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              placeholder="Your password"
              style={styles.input}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#3898ec";
                e.currentTarget.style.boxShadow = "#3898ec 0px 0px 0px 1px";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e8e6dc";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {error ? <p style={styles.errorMsg}>{error}</p> : null}
          {status ? <p style={styles.successMsg}>{status}</p> : null}

          <div style={styles.btnRow}>
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.btnPrimary,
                opacity: loading ? 0.55 : 1,
                cursor: loading ? "wait" : "pointer",
              }}
            >
              {loading ? "Working…" : "Sign in"}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleSignUp}
              style={{
                ...styles.btnSecondary,
                opacity: loading ? 0.55 : 1,
                cursor: loading ? "wait" : "pointer",
              }}
            >
              Create account
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#f5f4ed",
    padding: "20px",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    background: "#faf9f5",
    border: "1px solid #e8e6dc",
    borderRadius: "16px",
    padding: "32px",
    boxShadow: "rgba(0,0,0,0.05) 0px 4px 24px",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "8px",
  },
  brandGlyph: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "#141413",
    color: "#faf9f5",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Georgia, serif",
    fontStyle: "italic",
    fontWeight: 500,
    fontSize: "14px",
    flexShrink: 0,
  },
  brandName: {
    fontFamily: "Georgia, serif",
    fontWeight: 500,
    fontSize: "20px",
    color: "#141413",
    letterSpacing: "-0.01em",
  },
  brandEm: {
    color: "#c96442",
    fontStyle: "italic",
    fontWeight: 400,
  },
  subtitle: {
    margin: "0 0 28px",
    fontSize: "14px",
    color: "#87867f",
    lineHeight: "1.60",
  },
  form: {
    display: "grid",
    gap: "16px",
  },
  fieldGroup: {
    display: "grid",
    gap: "6px",
  },
  fieldLabel: {
    fontFamily: "ui-monospace, monospace",
    fontSize: "10px",
    letterSpacing: "0.16em",
    textTransform: "uppercase" as const,
    color: "#87867f",
    fontWeight: 500,
  },
  input: {
    padding: "10px 14px",
    borderRadius: "12px",
    border: "1px solid #e8e6dc",
    background: "#ffffff",
    color: "#141413",
    fontSize: "15px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
    width: "100%",
    boxSizing: "border-box" as const,
  },
  errorMsg: {
    margin: "0",
    fontSize: "13px",
    color: "#b53333",
    padding: "10px 12px",
    background: "oklch(0.95 0.03 25)",
    borderRadius: "8px",
    border: "1px solid oklch(0.82 0.07 25)",
    lineHeight: "1.5",
  },
  successMsg: {
    margin: "0",
    fontSize: "13px",
    color: "oklch(0.38 0.1 150)",
    padding: "10px 12px",
    background: "oklch(0.94 0.03 150)",
    borderRadius: "8px",
    border: "1px solid oklch(0.78 0.07 150)",
    lineHeight: "1.5",
  },
  btnRow: {
    display: "grid",
    gap: "8px",
  },
  btnPrimary: {
    padding: "11px 16px",
    borderRadius: "8px",
    border: "1px solid #141413",
    background: "#141413",
    color: "#faf9f5",
    fontSize: "14px",
    fontWeight: 500,
    fontFamily: "system-ui, -apple-system, sans-serif",
    boxShadow: "#141413 0px 0px 0px 0px, rgba(0,0,0,0.2) 0px 0px 0px 1px",
    transition: "background 0.15s, box-shadow 0.15s",
  },
  btnSecondary: {
    padding: "11px 16px",
    borderRadius: "8px",
    border: "1px solid #e8e6dc",
    background: "#e8e6dc",
    color: "#4d4c48",
    fontSize: "14px",
    fontWeight: 500,
    fontFamily: "system-ui, -apple-system, sans-serif",
    boxShadow: "#e8e6dc 0px 0px 0px 0px, #d1cfc5 0px 0px 0px 1px",
    transition: "background 0.15s, box-shadow 0.15s",
  },
};
