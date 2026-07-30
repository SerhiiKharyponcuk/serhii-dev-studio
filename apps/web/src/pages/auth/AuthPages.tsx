import axios from "axios";
import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { api } from "../../lib/api";

type AuthMode = "login" | "register" | "forgot" | "reset" | "resend";

export function AuthPage({ mode }: { mode: AuthMode }) {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [params] = useSearchParams();
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setFeedback(null);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await api.post(`/auth/${mode}`, values);
      const message =
        mode === "forgot"
          ? "If the account exists, reset instructions were sent."
          : mode === "resend"
            ? "If the account is awaiting verification, a new link was sent."
            : mode === "register"
              ? "Account created. Check your email before signing in."
              : mode === "reset"
                ? "Password updated. You can now sign in."
                : "Signed in successfully.";
      toast.success(message);
      if (mode === "forgot" || mode === "resend") {
        setFeedback({ type: "success", message });
      }
      if (mode === "login") void nav("/dashboard");
      if (mode === "register" || mode === "reset") void nav("/login");
    } catch (error) {
      let message = "Unable to complete this request. Please try again.";
      if (axios.isAxiosError<{ error?: { code?: string } }>(error)) {
        const code = error.response?.data?.error?.code;
        if (code === "INVALID_CREDENTIALS") message = "Email or password is incorrect.";
        if (code === "EMAIL_IN_USE")
          message = "An account already uses this email. Sign in or request a new link.";
        if (code === "INVALID_TOKEN") message = "This link is invalid or has expired.";
        if (error.response?.status === 429)
          message = "Too many attempts. Please wait a few minutes and try again.";
      }
      setFeedback({ type: "error", message });
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };
  const titles: Record<AuthMode, string> = {
    login: "Welcome back",
    register: "Create your client account",
    forgot: "Reset your password",
    reset: "Choose a new password",
    resend: "Request a new verification link"
  };
  const descriptions: Record<AuthMode, string> = {
    login: "Access your projects, files, messages and invoices.",
    register: "Create a secure workspace for your project.",
    forgot: "Enter your account email and we’ll send reset instructions if it exists.",
    reset: "Use at least 12 characters for your new password.",
    resend: "Enter the email used to create your account."
  };
  const submitLabels: Record<AuthMode, string> = {
    login: "Sign in",
    register: "Create account",
    forgot: "Send reset link",
    reset: "Update password",
    resend: "Send verification link"
  };
  return (
    <section className="section">
      <form
        className="shell glass card grid max-w-md gap-5"
        onSubmit={(event) => void submit(event)}
        aria-busy={busy}
      >
        <p className="eyebrow">Secure access</p>
        <h1 className="text-3xl font-bold">{titles[mode]}</h1>
        <p className="muted -mt-2 text-sm leading-6">{descriptions[mode]}</p>
        {mode === "reset" && <input type="hidden" name="token" value={params.get("token") ?? ""} />}
        {mode === "register" && (
          <label className="label">
            Name
            <input className="input" name="name" autoComplete="name" required minLength={2} />
          </label>
        )}
        {mode !== "reset" && (
          <label className="label">
            Email
            <input className="input" name="email" autoComplete="email" required type="email" />
          </label>
        )}
        {mode !== "forgot" && mode !== "resend" && (
          <label className="label">
            Password
            <input
              className="input"
              name="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              type="password"
              minLength={mode === "reset" ? 12 : 8}
            />
          </label>
        )}
        <button className="button button-primary" disabled={busy}>
          {busy ? (
            <>
              <LoaderCircle className="animate-spin" size={17} /> Please wait…
            </>
          ) : (
            submitLabels[mode]
          )}
        </button>
        {feedback && (
          <p
            className={`text-center text-sm ${
              feedback.type === "success" ? "text-emerald-300" : "text-red-300"
            }`}
            role={feedback.type === "error" ? "alert" : "status"}
          >
            {feedback.message}
          </p>
        )}
        {mode === "login" && (
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between">
              <Link to="/register">Create account</Link>
              <Link className="muted" to="/forgot-password">
                Forgot password?
              </Link>
            </div>
            <Link className="muted text-center" to="/resend-verification">
              Need a new verification link?
            </Link>
          </div>
        )}
        {mode !== "login" && (
          <Link className="muted text-center text-sm" to="/login">
            Back to sign in
          </Link>
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
            ? "Your account email is confirmed. You can now sign in."
            : state === "error"
              ? "This verification link is invalid or expired."
              : "Please wait a moment."}
        </p>
        {state === "success" ? (
          <Link className="button button-primary mt-7" to="/login">
            Sign in
          </Link>
        ) : state === "error" ? (
          <Link className="button button-ghost mt-7" to="/resend-verification">
            Request a new link
          </Link>
        ) : null}
      </div>
    </section>
  );
}
