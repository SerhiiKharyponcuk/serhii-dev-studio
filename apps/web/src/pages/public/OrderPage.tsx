import { zodResolver } from "@hookform/resolvers/zod";
import {
  buildApproaches,
  calculateOrderEstimate,
  orderSchema,
  projectTypes,
  websiteAddOns,
  type OrderInput
} from "@serhii-dev/contracts";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ReceiptText, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { LoadingLabel } from "../../components/AsyncState";
import { api } from "../../lib/api";
import { useI18n } from "../../i18n/I18nProvider";

const stepLabels = [
  "Project setup",
  "Features",
  "Project information",
  "Budget and deadline",
  "Contact and billing",
  "Project files",
  "Review and submit"
] as const;
const stepFields: (keyof OrderInput)[][] = [
  ["projectType", "buildApproach"],
  ["selectedFeatures"],
  ["projectName", "companyName", "description", "requiredFeatures", "references"],
  ["budgetRange", "preferredDeadline", "deadlineFlexible"],
  [
    "firstName",
    "lastName",
    "email",
    "phone",
    "telegram",
    "discord",
    "billingCompanyName",
    "billingAddressLine1",
    "billingAddressLine2",
    "billingCity",
    "billingRegion",
    "billingPostalCode",
    "country",
    "taxId"
  ],
  []
];
const serviceProjectTypes: Record<string, (typeof projectTypes)[number]> = {
  "landing-page": "Landing Page",
  "business-website": "Business Website",
  "portfolio-website": "Portfolio",
  "online-shop": "Online Shop",
  "admin-dashboard": "Admin Dashboard",
  "client-dashboard": "Client Dashboard",
  "minecraft-store": "Minecraft Store",
  "custom-web-application": "Custom Web App",
  "website-redesign": "Website Redesign",
  "website-maintenance": "Website Maintenance"
};
const approachLabels: Record<(typeof buildApproaches)[number], { title: string; text: string }> = {
  NEW_WEBSITE: { title: "New website", text: "A complete product created from the ground up" },
  REDESIGN: { title: "Redesign", text: "Improve an existing website without losing what works" },
  EXISTING_PROJECT: {
    title: "Continue a project",
    text: "Extend, repair or finish an existing build"
  }
};
const reviewLabels: Partial<Record<keyof OrderInput, string>> = {
  projectType: "Project type",
  buildApproach: "Starting point",
  selectedFeatures: "Selected features",
  projectName: "Project name",
  companyName: "Brand or company",
  description: "Description",
  requiredFeatures: "Additional requirements",
  references: "References",
  budgetRange: "Budget",
  preferredDeadline: "Preferred deadline",
  deadlineFlexible: "Deadline flexible",
  firstName: "First name",
  lastName: "Last name",
  email: "Email",
  phone: "Phone",
  telegram: "Telegram",
  discord: "Discord",
  billingCompanyName: "Billing company",
  billingAddressLine1: "Billing address",
  billingAddressLine2: "Address line 2",
  billingCity: "City",
  billingRegion: "State or region",
  billingPostalCode: "Postal code",
  country: "Country",
  taxId: "VAT / Tax ID"
};

function friendlyError(message: string) {
  if (message.includes("at least 20")) return "Please add at least 20 characters.";
  if (message.includes("at least 2")) return "Please enter at least 2 characters.";
  if (message.toLowerCase().includes("email")) return "Enter a valid email address.";
  if (message.includes("at least 1")) return "Please select an option.";
  return message;
}

export function OrderPage() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [orderNumber, setOrderNumber] = useState<string>();
  const [formStartedAt] = useState(() => Date.now());
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
      buildApproach: "NEW_WEBSITE",
      selectedFeatures: [],
      deadlineFlexible: true,
      formStartedAt
    }
  });
  const values = watch();
  const estimate = useMemo(
    () => calculateOrderEstimate(values.projectType, values.selectedFeatures ?? []),
    [values.projectType, values.selectedFeatures]
  );
  const next = async () => {
    if (await trigger(stepFields[step] ?? [])) setStep((current) => Math.min(6, current + 1));
  };
  const submit = handleSubmit(async (input) => {
    try {
      const { data } = await api.post<{
        data: { id: string; orderNumber: string; uploadToken: string };
      }>("/orders", { ...input, name: `${input.firstName} ${input.lastName}` });
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
          toast.warning(t("Your request was saved, but some files could not be uploaded."));
        }
      }
      setOrderNumber(data.data.orderNumber);
      toast.success(t("Project request sent."));
    } catch {
      toast.error(t("Could not send your request. Please review the form and try again."));
    }
  });

  if (orderNumber)
    return (
      <section className="section">
        <div className="shell glass card max-w-xl text-center">
          <CheckCircle2 className="mx-auto text-emerald-300" size={48} />
          <h1 className="mt-5 text-3xl font-bold">{t("Request received")}</h1>
          <p className="muted mt-3">
            {t("Your order number is")} <b className="text-white">{orderNumber}</b>.{" "}
            {t("A confirmation will be sent to your email.")}
          </p>
        </div>
      </section>
    );

  return (
    <section className="section">
      <div className="shell max-w-4xl">
        <p className="eyebrow">{t("Project configurator")}</p>
        <h1 className="section-title mt-3">{t("Build a clear brief in a few minutes.")}</h1>
        <p className="muted mt-4 max-w-2xl leading-7">
          {t(
            "Choose the product and features you need. The estimate updates immediately and the final fixed quote is confirmed after a scope review."
          )}
        </p>
        <div className="mt-8 flex items-center justify-between gap-4 text-sm">
          <b>{t(stepLabels[step] ?? "Project setup")}</b>
          <span className="muted">
            {t("Step")} {step + 1} {t("of")} {stepLabels.length}
          </span>
        </div>
        <div
          className="mt-3 flex gap-2"
          role="progressbar"
          aria-label={t("Form progress")}
          aria-valuemin={1}
          aria-valuemax={stepLabels.length}
          aria-valuenow={step + 1}
          aria-valuetext={`${t("Step")} ${step + 1} ${t("of")} ${stepLabels.length}`}
        >
          {stepLabels.map((label, index) => (
            <i
              key={label}
              className={`h-1 flex-1 rounded-full transition-colors ${index <= step ? "bg-indigo-500" : "bg-white/10"}`}
            />
          ))}
        </div>
        <form
          className="glass card mt-6"
          onSubmit={(event) => void submit(event)}
          aria-busy={isSubmitting}
        >
          <div className="honeypot-field" aria-hidden="true">
            <input {...register("website")} aria-hidden="true" tabIndex={-1} autoComplete="off" />
          </div>
          {step === 0 && (
            <div className="grid gap-8">
              <fieldset>
                <legend className="text-xl font-bold">{t("What are we starting with?")}</legend>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {buildApproaches.map((approach) => (
                    <label key={approach} className="choice-card">
                      <input
                        className="sr-only"
                        type="radio"
                        value={approach}
                        {...register("buildApproach")}
                      />
                      <span className="choice-check">
                        <Check size={14} />
                      </span>
                      <b>{t(approachLabels[approach].title)}</b>
                      <span className="muted text-sm leading-6">
                        {t(approachLabels[approach].text)}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="text-xl font-bold">{t("Choose a product")}</legend>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {projectTypes.map((type) => (
                    <label key={type} className="choice-card compact">
                      <input
                        className="sr-only"
                        type="radio"
                        value={type}
                        {...register("projectType")}
                      />
                      <span className="choice-check">
                        <Check size={14} />
                      </span>
                      <span>{t(type)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          )}
          {step === 1 && (
            <fieldset>
              <legend className="flex items-center gap-2 text-xl font-bold">
                <Sparkles className="text-indigo-300" size={20} /> {t("Select website features")}
              </legend>
              <p className="muted mt-3 text-sm">
                {t("Choose everything relevant. You can refine the scope during consultation.")}
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {websiteAddOns.map((feature) => (
                  <label key={feature.id} className="choice-card feature-card">
                    <input
                      className="sr-only"
                      type="checkbox"
                      value={feature.id}
                      {...register("selectedFeatures")}
                    />
                    <span className="choice-check">
                      <Check size={14} />
                    </span>
                    <b>{t(feature.label)}</b>
                    <span className="muted text-xs leading-5">{t(feature.description)}</span>
                    <span className="mt-auto text-sm font-semibold text-indigo-200">
                      +${feature.price.toLocaleString()}
                    </span>
                  </label>
                ))}
              </div>
              <div className="estimate-panel mt-6" aria-live="polite">
                <div>
                  <span className="muted text-xs uppercase tracking-widest">
                    {t("Planning estimate")}
                  </span>
                  <p className="mt-1 text-2xl font-bold">
                    {t("From")} ${estimate.toLocaleString()}
                  </p>
                </div>
                <span className="muted max-w-sm text-xs leading-5">
                  {t(
                    "Not a binding quote. Complex integrations and custom workflows are scoped separately."
                  )}
                </span>
              </div>
            </fieldset>
          )}
          {step === 2 && (
            <div className="grid gap-5">
              <h2 className="text-xl font-bold">{t("Tell me about the project")}</h2>
              <Field label="Project name" error={errors.projectName?.message}>
                <input
                  className="input"
                  placeholder="e.g. Acme client portal"
                  {...register("projectName")}
                />
              </Field>
              <Field label="Brand or company name" optional>
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
              <Field
                label="Additional requirements"
                optional
                error={errors.requiredFeatures?.message}
              >
                <textarea
                  className="input"
                  placeholder="Anything not covered by the selected features"
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
          {step === 3 && (
            <div className="grid gap-5">
              <h2 className="text-xl font-bold">{t("Budget and deadline")}</h2>
              <div className="estimate-panel">
                <div>
                  <span className="muted text-xs uppercase tracking-widest">
                    {t("Current configuration")}
                  </span>
                  <p className="mt-1 text-2xl font-bold">
                    {t("From")} ${estimate.toLocaleString()}
                  </p>
                </div>
                <ReceiptText className="text-indigo-300" />
              </div>
              <Field label="Comfortable budget range" error={errors.budgetRange?.message}>
                <select className="input" {...register("budgetRange")}>
                  <option value="">{t("Select range")}</option>
                  <option>$600–$1,200</option>
                  <option>$1,200–$2,800</option>
                  <option>$2,800–$6,000</option>
                  <option>$6,000+</option>
                </select>
              </Field>
              <Field label="Preferred deadline" optional>
                <input className="input" type="date" {...register("preferredDeadline")} />
              </Field>
              <label className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" {...register("deadlineFlexible")} />
                {t("The deadline is flexible")}
              </label>
            </div>
          )}
          {step === 4 && (
            <div className="grid gap-5 sm:grid-cols-2">
              <h2 className="col-span-full text-xl font-bold">{t("Contact person")}</h2>
              <Field label="First name" error={errors.firstName?.message}>
                <input className="input" autoComplete="given-name" {...register("firstName")} />
              </Field>
              <Field label="Last name" error={errors.lastName?.message}>
                <input className="input" autoComplete="family-name" {...register("lastName")} />
              </Field>
              <Field label="Email" error={errors.email?.message}>
                <input className="input" autoComplete="email" type="email" {...register("email")} />
              </Field>
              <Field label="Phone" optional>
                <input className="input" autoComplete="tel" type="tel" {...register("phone")} />
              </Field>
              <Field label="Telegram" optional>
                <input className="input" placeholder="@username" {...register("telegram")} />
              </Field>
              <Field label="Discord" optional>
                <input className="input" placeholder="username" {...register("discord")} />
              </Field>
              <div className="col-span-full mt-3 border-t border-white/10 pt-6">
                <h3 className="font-bold">{t("Billing details")}</h3>
                <p className="muted mt-2 text-sm">
                  {t(
                    "Optional now. Saving them here makes future contracts and invoices accurate."
                  )}
                </p>
              </div>
              <Field label="Legal company name" optional>
                <input
                  className="input"
                  autoComplete="organization"
                  {...register("billingCompanyName")}
                />
              </Field>
              <Field label="VAT / Tax ID" optional>
                <input className="input" autoComplete="off" {...register("taxId")} />
              </Field>
              <Field label="Street and number" optional error={errors.billingAddressLine1?.message}>
                <input
                  className="input"
                  autoComplete="address-line1"
                  {...register("billingAddressLine1")}
                />
              </Field>
              <Field label="Apartment, suite, unit" optional>
                <input
                  className="input"
                  autoComplete="address-line2"
                  {...register("billingAddressLine2")}
                />
              </Field>
              <Field label="City" optional>
                <input
                  className="input"
                  autoComplete="address-level2"
                  {...register("billingCity")}
                />
              </Field>
              <Field label="State or region" optional>
                <input
                  className="input"
                  autoComplete="address-level1"
                  {...register("billingRegion")}
                />
              </Field>
              <Field label="Postal code" optional>
                <input
                  className="input"
                  autoComplete="postal-code"
                  {...register("billingPostalCode")}
                />
              </Field>
              <Field label="Country" error={errors.country?.message}>
                <input className="input" autoComplete="country-name" {...register("country")} />
              </Field>
            </div>
          )}
          {step === 5 && (
            <div>
              <h2 className="text-xl font-bold">{t("Project files")}</h2>
              <p className="muted mt-3 text-sm">
                {t("Attach up to four PDF, image, text or ZIP files. Maximum 10 MB each.")}
              </p>
              <input
                className="input mt-6"
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.zip"
                aria-label={t("Project files")}
                onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 4))}
              />
              {files.length > 0 && (
                <p className="muted mt-3 text-sm">
                  {files.length} {t(files.length === 1 ? "file selected" : "files selected")}
                </p>
              )}
            </div>
          )}
          {step === 6 && (
            <div>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">{t("Review and submit")}</h2>
                  <p className="muted mt-2 text-sm">{t("Check the details before sending.")}</p>
                </div>
                <p className="text-right">
                  <span className="muted block text-xs">{t("Estimated from")}</span>
                  <b className="text-2xl">${estimate.toLocaleString()}</b>
                </p>
              </div>
              <dl className="mt-6 grid gap-3 text-sm">
                {Object.entries(values)
                  .filter(([key]) => !["website", "formStartedAt"].includes(key))
                  .map(([key, value]) => (
                    <div
                      key={key}
                      className="grid gap-1 border-b border-white/8 pb-3 sm:grid-cols-[180px_1fr]"
                    >
                      <dt className="muted">{t(reviewLabels[key as keyof OrderInput] ?? key)}</dt>
                      <dd>
                        {key === "selectedFeatures"
                          ? Array.isArray(value) && value.length
                            ? websiteAddOns
                                .filter((item) => value.includes(item.id))
                                .map((item) => t(item.label))
                                .join(", ")
                            : t("No add-ons")
                          : key === "buildApproach"
                            ? t(approachLabels[value as keyof typeof approachLabels]?.title ?? "")
                            : typeof value === "boolean"
                              ? value
                                ? t("Yes")
                                : t("No")
                              : String(value || "—")}
                      </dd>
                    </div>
                  ))}
              </dl>
            </div>
          )}
          <div className="mt-8 flex justify-between gap-3">
            <button
              className="button button-ghost"
              type="button"
              disabled={step === 0}
              onClick={() => setStep((current) => current - 1)}
            >
              <ArrowLeft size={16} />
              {t("Back")}
            </button>
            {step < 6 ? (
              <button className="button button-primary" type="button" onClick={() => void next()}>
                {t("Continue")}
                <ArrowRight size={16} />
              </button>
            ) : (
              <button className="button button-primary" disabled={isSubmitting} type="submit">
                {isSubmitting ? <LoadingLabel>{t("Sending")}</LoadingLabel> : t("Send request")}
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
  const { t } = useI18n();
  return (
    <label className="label">
      <span className="flex items-center justify-between gap-3">
        {t(label)}
        {optional && <span className="field-hint">{t("Optional")}</span>}
      </span>
      {children}
      {error && <span className="text-xs text-red-300">{t(friendlyError(error))}</span>}
    </label>
  );
}
