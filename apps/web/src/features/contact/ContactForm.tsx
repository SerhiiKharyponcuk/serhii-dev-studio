import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../lib/api";

export function ContactForm() {
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      const form = event.currentTarget;
      await api.post("/contact", Object.fromEntries(new FormData(form)));
      form.reset();
      toast.success("Message sent");
    } catch {
      toast.error("Message could not be sent");
    } finally {
      setBusy(false);
    }
  };
  return (
    <form
      className="shell glass card mt-10 grid max-w-2xl gap-5 sm:grid-cols-2"
      onSubmit={(event) => void submit(event)}
    >
      <label className="label">
        Name
        <input className="input" name="name" minLength={2} maxLength={100} required />
      </label>
      <label className="label">
        Email
        <input className="input" name="email" type="email" required />
      </label>
      <label className="label sm:col-span-2">
        Subject
        <input className="input" name="subject" minLength={3} maxLength={150} required />
      </label>
      <label className="label sm:col-span-2">
        Message
        <textarea className="input" name="message" minLength={20} maxLength={5000} required />
      </label>
      <button className="button button-primary sm:col-span-2" disabled={busy}>
        {busy ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
