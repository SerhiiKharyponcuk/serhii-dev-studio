import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { api } from "../../lib/api";

export function AuthPage({ mode }: { mode: "login" | "register" | "forgot" | "reset" }) {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [params] = useSearchParams();
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    const values = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await api.post(`/auth/${mode}`, values);
      toast.success(
        mode === "forgot" ? "If the account exists, reset instructions were sent." : "Success"
      );
      if (mode === "login" || mode === "register") void nav("/dashboard");
    } catch {
      toast.error("Unable to complete this request.");
    } finally {
      setBusy(false);
    }
  };
  const titles = {
    login: "Welcome back",
    register: "Create your client account",
    forgot: "Reset your password",
    reset: "Choose a new password"
  };
  return (
    <section className="section">
      <form className="shell glass card grid max-w-md gap-5" onSubmit={(e) => void submit(e)}>
        <p className="eyebrow">Secure access</p>
        <h1 className="text-3xl font-bold">{titles[mode]}</h1>
        {mode === "reset" && (
          <input type="hidden" name="token" value={params.get("token") ?? ""} />
        )}{" "}
        {mode === "register" && (
          <label className="label">
            Name
            <input className="input" name="name" required minLength={2} />
          </label>
        )}
        {mode !== "reset" && (
          <label className="label">
            Email
            <input className="input" name="email" required type="email" />
          </label>
        )}
        {mode !== "forgot" && (
          <label className="label">
            Password
            <input
              className="input"
              name="password"
              required
              type="password"
              minLength={mode === "reset" ? 12 : 8}
            />
          </label>
        )}
        <button className="button button-primary" disabled={busy}>
          {busy ? "Please wait…" : "Continue"}
        </button>
        {mode === "login" && (
          <div className="flex justify-between text-sm">
            <Link to="/register">Create account</Link>
            <Link className="muted" to="/forgot-password">
              Forgot password?
            </Link>
          </div>
        )}
      </form>
    </section>
  );
}

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setState("error");
      return;
    }
    void api
      .post("/auth/verify-email", { token })
      .then(() => setState("success"))
      .catch(() => setState("error"));
  }, [params]);
  return (
    <section className="section">
      <div className="shell glass card max-w-md text-center">
        <p className="eyebrow">Email verification</p>
        <h1 className="mt-4 text-3xl font-bold">
          {state === "loading"
            ? "Verifying…"
            : state === "success"
              ? "Email verified"
              : "Link unavailable"}
        </h1>
        <p className="muted mt-4">
          {state === "success"
            ? "Your account email is confirmed. You can continue to your dashboard."
            : state === "error"
              ? "This verification link is invalid or expired."
              : "Please wait a moment."}
        </p>
        {state === "success" && (
          <Link className="button button-primary mt-7" to="/dashboard">
            Open dashboard
          </Link>
        )}
      </div>
    </section>
  );
}
