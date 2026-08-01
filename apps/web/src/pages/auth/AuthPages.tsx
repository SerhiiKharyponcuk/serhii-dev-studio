import axios from "axios";
import { LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { api } from "../../lib/api";
import { useI18n } from "../../i18n/I18nProvider";

type AuthMode = "login" | "register" | "forgot" | "reset" | "resend";

export function AuthPage({ mode }: { mode: AuthMode }) {
  const { t } = useI18n();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [params] = useSearchParams();
  const [resetToken] = useState(() => params.get("token") ?? "");
  useEffect(() => {
    if (mode === "reset" && resetToken) window.history.replaceState(null, "", "/reset-password");
  }, [mode, resetToken]);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setFeedback(null);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const firstName = typeof values.firstName === "string" ? values.firstName : "";
    const lastName = typeof values.lastName === "string" ? values.lastName : "";
    const payload =
      mode === "register"
        ? {
            ...values,
            name: `${firstName} ${lastName}`.trim()
          }
        : values;
    try {
      const response = await api.post<{ data?: { requiresAdminVerification?: boolean } }>(
        `/auth/${mode}`,
        payload
      );
      if (mode === "login" && response.data.data?.requiresAdminVerification) {
        const message = "Check your email to confirm this admin sign-in.";
        setFeedback({ type: "success", message: t(message) });
        toast.success(t(message));
        return;
      }
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
      toast.success(t(message));
      if (mode === "forgot" || mode === "resend") {
        setFeedback({ type: "success", message: t(message) });
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
      setFeedback({ type: "error", message: t(message) });
      toast.error(t(message));
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
        <p className="eyebrow">{t("Secure access")}</p>
        <h1 className="text-3xl font-bold">{t(titles[mode])}</h1>
        <p className="muted -mt-2 text-sm leading-6">{t(descriptions[mode])}</p>
        {mode === "reset" && <input type="hidden" name="token" value={resetToken} />}
        {mode === "register" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="label">
              {t("First name")}
              <input
                className="input"
                name="firstName"
                autoComplete="given-name"
                required
                minLength={2}
              />
            </label>
            <label className="label">
              {t("Last name")}
              <input
                className="input"
                name="lastName"
                autoComplete="family-name"
                required
                minLength={2}
              />
            </label>
          </div>
        )}
        {mode !== "reset" && (
          <label className="label">
            {t("Email")}
            <input className="input" name="email" autoComplete="email" required type="email" />
          </label>
        )}
        {mode !== "forgot" && mode !== "resend" && (
          <label className="label">
            {t("Password")}
            <input
              className="input"
              name="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              type="password"
              minLength={mode === "login" ? 8 : 12}
              pattern={mode === "login" ? undefined : "(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{12,}"}
              aria-describedby={mode === "login" ? undefined : "password-requirements"}
            />
            {mode !== "login" && (
              <span className="field-hint" id="password-requirements">
                {t("At least 12 characters with uppercase, lowercase and a number.")}
              </span>
            )}
          </label>
        )}
        <button className="button button-primary" disabled={busy}>
          {busy ? (
            <>
              <LoaderCircle className="animate-spin" size={17} /> {t("Please wait…")}
            </>
          ) : (
            t(submitLabels[mode])
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
              <Link to="/register">{t("Create account")}</Link>
              <Link className="muted" to="/forgot-password">
                {t("Forgot password?")}
              </Link>
            </div>
            <Link className="muted text-center" to="/resend-verification">
              {t("Need a new verification link?")}
            </Link>
          </div>
        )}
        {mode !== "login" && (
          <Link className="muted text-center text-sm" to="/login">
            {t("Back to sign in")}
          </Link>
        )}
      </form>
    </section>
  );
}

export function VerifyEmailPage() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setState("error");
      return;
    }
    window.history.replaceState(null, "", "/verify-email");
    void api
      .post("/auth/verify-email", { token })
      .then(() => setState("success"))
      .catch(() => setState("error"));
  }, [params]);
  return (
    <section className="section">
      <div className="shell glass card max-w-md text-center">
        <p className="eyebrow">{t("Email verification")}</p>
        <h1 className="mt-4 text-3xl font-bold">
          {state === "loading"
            ? t("Verifying…")
            : state === "success"
              ? t("Email verified")
              : t("Link unavailable")}
        </h1>
        <p className="muted mt-4">
          {state === "success"
            ? t("Your account email is confirmed. You can now sign in.")
            : state === "error"
              ? t("This verification link is invalid or expired.")
              : t("Please wait a moment.")}
        </p>
        {state === "success" ? (
          <Link className="button button-primary mt-7" to="/login">
            {t("Sign in")}
          </Link>
        ) : state === "error" ? (
          <Link className="button button-ghost mt-7" to="/resend-verification">
            {t("Request a new link")}
          </Link>
        ) : null}
      </div>
    </section>
  );
}

export function AdminVerifyPage() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const attempted = useRef(false);
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;
    const token = params.get("token");
    if (!token) {
      setState("error");
      return;
    }
    window.history.replaceState(null, "", "/admin/verify");
    void api
      .post("/auth/admin-verify", { token })
      .then(() => setState("success"))
      .catch(() => setState("error"));
  }, [params]);
  return (
    <section className="section">
      <div className="shell glass card max-w-md text-center">
        <p className="eyebrow">{t("Admin security check")}</p>
        <h1 className="mt-4 text-3xl font-bold">
          {state === "loading"
            ? t("Confirming sign-in…")
            : state === "success"
              ? t("Admin sign-in confirmed")
              : t("Link unavailable")}
        </h1>
        <p className="muted mt-4">
          {state === "success"
            ? t("Your secure admin session is ready.")
            : state === "error"
              ? t("This admin verification link is invalid or expired.")
              : t("Please wait a moment.")}
        </p>
        {state === "success" ? (
          <Link className="button button-primary mt-7" to="/admin">
            {t("Open admin panel")}
          </Link>
        ) : state === "error" ? (
          <Link className="button button-ghost mt-7" to="/login">
            {t("Back to sign in")}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
