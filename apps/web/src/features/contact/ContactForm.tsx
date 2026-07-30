import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../lib/api";

export function ContactForm() {
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
      toast.success("Message sent.");
    } catch {
      setStatus("error");
      toast.error("Couldn’t send your message. Try again.");
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
      <label className="label">
        Name
        <input
          className="input"
          name="name"
          autoComplete="name"
          minLength={2}
          maxLength={100}
          placeholder="Your name"
          required
        />
      </label>
      <label className="label">
        Email
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
        Subject
        <input
          className="input"
          name="subject"
          minLength={3}
          maxLength={150}
          placeholder="Website redesign, client portal, custom application…"
          required
        />
      </label>
      <label className="label sm:col-span-2">
        Message
        <textarea
          className="input"
          name="message"
          minLength={20}
          maxLength={5000}
          placeholder="Tell me about your goals, current situation and preferred timeline."
          aria-describedby="contact-message-hint"
          required
        />
        <span className="field-hint" id="contact-message-hint">
          Include enough context for a useful first reply. Minimum 20 characters.
        </span>
      </label>
      <button className="button button-primary sm:col-span-2" disabled={busy}>
        {busy ? (
          <>
            <LoaderCircle className="animate-spin" size={17} /> Sending…
          </>
        ) : (
          "Send message"
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
            ? "Thanks — your message has been received."
            : "The message was not sent. Please try again in a moment."}
        </p>
      )}
    </form>
  );
}
