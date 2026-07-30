import { zodResolver } from "@hookform/resolvers/zod";
import { orderSchema, projectTypes, type OrderInput } from "@serhii-dev/contracts";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { api } from "../../lib/api";
import { LoadingLabel } from "../../components/AsyncState";

const stepLabels = [
  "Project type",
  "Project information",
  "Budget and deadline",
  "Contact details",
  "Project files",
  "Review and submit"
] as const;
const stepFields: (keyof OrderInput)[][] = [
  ["projectType"],
  ["projectName", "companyName", "description", "requiredFeatures", "references"],
  ["budgetRange", "preferredDeadline", "deadlineFlexible"],
  ["name", "email", "telegram", "discord", "country"],
  []
];
const serviceProjectTypes: Record<string, (typeof projectTypes)[number]> = {
  "landing-page": "Landing Page",
  "business-website": "Business Website",
  "portfolio-website": "Portfolio",
  "online-shop": "Online Shop",
  "admin-dashboard": "Dashboard",
  "client-dashboard": "Dashboard",
  "minecraft-store": "Minecraft Store",
  "custom-web-application": "Custom Web App",
  "website-redesign": "Other",
  "website-maintenance": "Other"
};
const reviewLabels: Partial<Record<keyof OrderInput, string>> = {
  projectType: "Project type",
  projectName: "Project name",
  companyName: "Company",
  description: "Description",
  requiredFeatures: "Required features",
  references: "References",
  budgetRange: "Budget",
  preferredDeadline: "Preferred deadline",
  deadlineFlexible: "Deadline flexible",
  name: "Contact name",
  email: "Email",
  telegram: "Telegram",
  discord: "Discord",
  country: "Country"
};
function friendlyError(message: string) {
  if (message.includes("at least 20")) return "Please add at least 20 characters.";
  if (message.includes("at least 2")) return "Please enter at least 2 characters.";
  if (message.toLowerCase().includes("email")) return "Enter a valid email address.";
  if (message.includes("at least 1")) return "Please select an option.";
  return message;
}

export function OrderPage() {
  const [params] = useSearchParams();
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [orderNumber, setOrderNumber] = useState<string>();
  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors, isSubmitting }
  } = useForm<OrderInput>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      projectType: serviceProjectTypes[params.get("service") ?? ""] ?? "Landing Page",
      deadlineFlexible: true
    }
  });
  const next = async () => {
    if (await trigger(stepFields[step] ?? [])) setStep((s) => Math.min(5, s + 1));
  };
  const submit = handleSubmit(async (values) => {
    try {
      const { data } = await api.post<{
        data: { id: string; orderNumber: string; uploadToken: string };
      }>("/orders", values);
      if (files.length) {
        try {
          const payload = new FormData();
          files.forEach((file) => payload.append("files", file));
          await api.post(`/orders/${data.data.id}/files`, payload, {
            headers: {
              "Content-Type": "multipart/form-data",
              "X-Upload-Token": data.data.uploadToken
            }
          });
        } catch {
          toast.warning("Your request was saved, but some files couldn’t be uploaded.");
        }
      }
      setOrderNumber(data.data.orderNumber);
      toast.success("Project request sent.");
    } catch {
      toast.error("Couldn’t send your request. Try again.");
    }
  });
  if (orderNumber)
    return (
      <section className="section">
        <div className="shell glass card max-w-xl text-center">
          <CheckCircle2 className="mx-auto text-emerald-300" size={48} />
          <h1 className="mt-5 text-3xl font-bold">Request received</h1>
          <p className="muted mt-3">
            Your order number is <b className="text-white">{orderNumber}</b>. A confirmation will be
            sent to your email.
          </p>
        </div>
      </section>
    );
  return (
    <section className="section">
      <div className="shell max-w-3xl">
        <p className="eyebrow">Project brief</p>
        <h1 className="section-title mt-3">Let’s understand what you need.</h1>
        <div className="mt-8 flex items-center justify-between gap-4 text-sm">
          <b>{stepLabels[step]}</b>
          <span className="muted">
            Step {step + 1} of {stepLabels.length}
          </span>
        </div>
        <div
          className="mt-3 flex gap-2"
          role="progressbar"
          aria-label="Form progress"
          aria-valuemin={1}
          aria-valuemax={6}
          aria-valuenow={step + 1}
          aria-valuetext={`Step ${step + 1} of 6`}
        >
          {Array.from({ length: 6 }, (_, i) => (
            <i
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= step ? "bg-indigo-500" : "bg-white/10"}`}
            />
          ))}
        </div>
        <form
          className="glass card mt-6"
          onSubmit={(event) => void submit(event)}
          aria-busy={isSubmitting}
        >
          {step === 0 && (
            <fieldset>
              <legend className="text-xl font-bold">1. Project type</legend>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {projectTypes.map((t) => (
                  <label
                    key={t}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 p-4 transition-colors duration-200 hover:bg-white/5 has-[:checked]:border-indigo-400/50 has-[:checked]:bg-indigo-500/10"
                  >
                    <input type="radio" value={t} {...register("projectType")} />
                    {t}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {step === 1 && (
            <div className="grid gap-5">
              <h2 className="text-xl font-bold">2. Project information</h2>
              <Field label="Project name" error={errors.projectName?.message}>
                <input
                  className="input"
                  placeholder="e.g. Acme client portal"
                  {...register("projectName")}
                />
              </Field>
              <Field label="Company name" optional>
                <input
                  className="input"
                  autoComplete="organization"
                  placeholder="Your company or brand"
                  {...register("companyName")}
                />
              </Field>
              <Field label="Project description" error={errors.description?.message}>
                <textarea
                  className="input"
                  placeholder="What are you building, who is it for and what should it achieve?"
                  {...register("description")}
                />
              </Field>
              <Field label="Required features" error={errors.requiredFeatures?.message}>
                <textarea
                  className="input"
                  placeholder="List the essential pages, workflows and integrations."
                  {...register("requiredFeatures")}
                />
              </Field>
              <Field label="Reference websites" optional>
                <input
                  className="input"
                  inputMode="url"
                  placeholder="Links or products you like"
                  {...register("references")}
                />
              </Field>
            </div>
          )}
          {step === 2 && (
            <div className="grid gap-5">
              <h2 className="text-xl font-bold">3. Budget and deadline</h2>
              <Field label="Budget range" error={errors.budgetRange?.message}>
                <select className="input" {...register("budgetRange")}>
                  <option value="">Select range</option>
                  <option>$750–$1,500</option>
                  <option>$1,500–$3,500</option>
                  <option>$3,500–$7,500</option>
                  <option>$7,500+</option>
                </select>
              </Field>
              <Field label="Preferred deadline" optional>
                <input className="input" type="date" {...register("preferredDeadline")} />
              </Field>
              <label className="flex gap-3">
                <input type="checkbox" {...register("deadlineFlexible")} />
                The deadline is flexible
              </label>
            </div>
          )}
          {step === 3 && (
            <div className="grid gap-5 sm:grid-cols-2">
              <h2 className="col-span-full text-xl font-bold">4. Contact details</h2>
              <Field label="Name" error={errors.name?.message}>
                <input className="input" autoComplete="name" {...register("name")} />
              </Field>
              <Field label="Email" error={errors.email?.message}>
                <input className="input" autoComplete="email" type="email" {...register("email")} />
              </Field>
              <Field label="Telegram" optional>
                <input className="input" placeholder="@username" {...register("telegram")} />
              </Field>
              <Field label="Discord" optional>
                <input className="input" placeholder="username" {...register("discord")} />
              </Field>
              <Field label="Country" error={errors.country?.message}>
                <input className="input" autoComplete="country-name" {...register("country")} />
              </Field>
            </div>
          )}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-bold">5. Project files</h2>
              <p className="muted mt-3 text-sm">
                Attach up to four PDF, image, text or ZIP files. Maximum 10 MB each.
              </p>
              <input
                className="input mt-6"
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.zip"
                aria-label="Project files"
                onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 4))}
              />
              {files.length > 0 && (
                <p className="muted mt-3 text-sm">
                  {files.length} file{files.length === 1 ? "" : "s"} selected
                </p>
              )}
            </div>
          )}
          {step === 5 && (
            <div>
              <h2 className="text-xl font-bold">6. Review and submit</h2>
              <dl className="mt-6 grid gap-3 text-sm">
                {Object.entries(watch()).map(([k, v]) => (
                  <div
                    key={k}
                    className="grid gap-1 border-b border-white/8 pb-3 sm:grid-cols-[180px_1fr]"
                  >
                    <dt className="muted">{reviewLabels[k as keyof OrderInput] ?? k}</dt>
                    <dd>{typeof v === "boolean" ? (v ? "Yes" : "No") : String(v || "—")}</dd>
                  </div>
                ))}
              </dl>
              <p className="muted mt-5 text-sm">
                File attachments become available securely after the order is created.
              </p>
            </div>
          )}
          <div className="mt-8 flex justify-between">
            <button
              className="button button-ghost"
              type="button"
              disabled={step === 0}
              onClick={() => setStep((s) => s - 1)}
            >
              <ArrowLeft size={16} />
              Back
            </button>
            {step < 5 ? (
              <button className="button button-primary" type="button" onClick={() => void next()}>
                Continue
                <ArrowRight size={16} />
              </button>
            ) : (
              <button className="button button-primary" disabled={isSubmitting} type="submit">
                {isSubmitting ? <LoadingLabel>Sending</LoadingLabel> : "Send request"}
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
function Field({
  label,
  error,
  optional = false,
  children
}: {
  label: string;
  error?: string | undefined;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="label">
      <span className="flex items-center justify-between gap-3">
        {label}
        {optional && <span className="field-hint">Optional</span>}
      </span>
      {children}
      {error && <span className="text-xs text-red-300">{friendlyError(error)}</span>}
    </label>
  );
}
