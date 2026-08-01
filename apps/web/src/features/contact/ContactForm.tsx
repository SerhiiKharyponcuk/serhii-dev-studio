import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../lib/api";
import { useI18n } from "../../i18n/I18nProvider";

export function ContactForm() {
  const { t } = useI18n();
  const [formStartedAt] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setStatus("idle");
    try {
      const form = event.currentTarget;
      await api.post("/contact", Object.fromEntries(new FormData(form)));
      form.reset();
      setStatus("success");
      toast.success(t("Message sent."));
    } catch {
      setStatus("error");
      toast.error(t("Couldn’t send your message. Try again."));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form
      className="shell glass card mt-10 grid max-w-2xl gap-5 sm:grid-cols-2"
      onSubmit={(event) => void submit(event)}
      aria-busy={busy}
    >
      <input type="hidden" name="formStartedAt" value={formStartedAt} />
      <div className="honeypot-field" aria-hidden="true">
        <input name="website" aria-hidden="true" tabIndex={-1} autoComplete="off" />
      </div>
      <label className="label">
        {t("Name")}
        <input
          className="input"
          name="name"
          autoComplete="name"
          minLength={2}
          maxLength={100}
          placeholder={t("Your name")}
          required
        />
      </label>
      <label className="label">
        {t("Email")}
        <input
          className="input"
          name="email"
          autoComplete="email"
          type="email"
          placeholder="you@company.com"
          required
        />
      </label>
      <label className="label sm:col-span-2">
        {t("Subject")}
        <input
          className="input"
          name="subject"
          minLength={3}
          maxLength={150}
          placeholder={t("Website redesign, client portal, custom application…")}
          required
        />
      </label>
      <label className="label sm:col-span-2">
        {t("Message")}
        <textarea
          className="input"
          name="message"
          minLength={20}
          maxLength={5000}
          placeholder={t("Tell me about your goals, current situation and preferred timeline.")}
          aria-describedby="contact-message-hint"
          required
        />
        <span className="field-hint" id="contact-message-hint">
          {t("Include enough context for a useful first reply. Minimum 20 characters.")}
        </span>
      </label>
      <button className="button button-primary sm:col-span-2" disabled={busy}>
        {busy ? (
          <>
            <LoaderCircle className="animate-spin" size={17} /> {t("Sending…")}
          </>
        ) : (
          t("Send message")
        )}
      </button>
      {status !== "idle" && (
        <p
          className={`sm:col-span-2 flex items-center justify-center gap-2 text-center text-sm ${
            status === "success" ? "text-emerald-300" : "text-red-300"
          }`}
          role={status === "error" ? "alert" : "status"}
        >
          {status === "success" && <CheckCircle2 size={16} />}
          {status === "success"
            ? t("Thanks — your message has been received.")
            : t("The message was not sent. Please try again in a moment.")}
        </p>
      )}
    </form>
  );
}
