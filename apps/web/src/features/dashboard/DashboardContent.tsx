import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Download, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { api } from "../../lib/api";
import { EmptyState, ErrorState, LoadingLabel, LoadingState } from "../../components/AsyncState";

type Project = {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  currency: string;
  budget: number;
  paid: number;
  deadline: string | null;
  stages: { id: string; name: string; status: string; position: number }[];
};
type Payment = {
  id: string;
  paymentNumber: string;
  purpose: string;
  status: string;
  amount: number;
  currency: string;
  dueDate: string | null;
  projectId: string;
};
type Invoice = {
  id: string;
  invoiceNumber: string;
  description: string;
  status: string;
  total: number;
  currency: string;
  dueDate: string;
};
type Notification = {
  id: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
};
type Conversation = {
  id: string;
  subject: string;
  messages: { content: string; createdAt: string }[];
};
type ConversationDetail = {
  id: string;
  subject: string;
  messages: {
    id: string;
    content: string;
    createdAt: string;
    sender: { id: string; name: string; role: string };
  }[];
};
type Order = {
  id: string;
  orderNumber: string;
  projectName: string;
  projectType: string;
  buildApproach: string;
  selectedFeatures: string[];
  estimatedPriceCents: number | null;
  status: string;
  contactName: string;
  contactEmail: string;
  createdAt: string;
};
const money = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount / 100);
const formText = (form: FormData, key: string) => {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
};
const statusTone = (status: string) =>
  ["PAID", "COMPLETED", "APPROVED", "ACCEPTED"].includes(status)
    ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
    : ["FAILED", "CANCELLED", "REJECTED", "OVERDUE"].includes(status)
      ? "border-red-400/25 bg-red-400/10 text-red-200"
      : ["DEVELOPMENT", "WAITING_CONFIRMATION", "REVIEW", "TESTING"].includes(status)
        ? "border-indigo-400/25 bg-indigo-400/10 text-indigo-200"
        : "border-amber-400/25 bg-amber-400/10 text-amber-100";
const humanize = (value: string) => {
  const normalized = value.replaceAll("_", " ").toLocaleLowerCase();
  return normalized.charAt(0).toLocaleUpperCase() + normalized.slice(1);
};

function State({
  pending,
  error,
  empty,
  emptyTitle,
  emptyDescription
}: {
  pending: boolean;
  error: boolean;
  empty: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (pending) return <LoadingState className="mt-7" />;
  if (error) return <ErrorState className="mt-7" />;
  if (empty)
    return <EmptyState className="mt-7" title={emptyTitle} description={emptyDescription} />;
  return null;
}
export function ProjectsContent({ admin = false }: { admin?: boolean }) {
  const client = useQueryClient();
  const q = useQuery({
    queryKey: ["projects"],
    queryFn: async () => (await api.get<{ data: Project[] }>("/client/projects")).data.data
  });
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status?: string; progress?: number } }) =>
      api.patch(`/admin/projects/${id}`, data),
    onSuccess: () => {
      toast.success("Project updated.");
      void client.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: () => toast.error("Couldn’t update the project. Try again.")
  });
  const state = <State pending={q.isPending} error={q.isError} empty={q.data?.length === 0} />;
  if (!q.data?.length) return state;
  return (
    <div className="mt-7 grid gap-4">
      {q.data.map((p) => (
        <article className="glass card" key={p.id}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className={`pill ${statusTone(p.status)}`}>{humanize(p.status)}</span>
              <h2 className="mt-4 text-xl font-bold">{p.name}</h2>
              <p className="muted mt-2 text-sm">{p.description}</p>
            </div>
            <b>{p.progress}%</b>
          </div>
          <div
            className="mt-5 h-2 overflow-hidden rounded-full bg-white/7"
            role="progressbar"
            aria-label={`${p.name} progress`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.min(100, p.progress)}
          >
            <i
              className="block h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-400"
              style={{ width: `${Math.min(100, p.progress)}%` }}
            />
          </div>
          <div className="muted mt-4 flex flex-wrap gap-5 text-xs">
            <span>Budget {money(p.budget, p.currency)}</span>
            <span>Paid {money(p.paid, p.currency)}</span>
            {p.deadline && <span>Deadline {new Date(p.deadline).toLocaleDateString()}</span>}
          </div>
          {p.stages.length > 0 && (
            <ol className="mt-5 grid gap-2 border-t border-white/8 pt-5 sm:grid-cols-2">
              {p.stages.map((stage) => (
                <li className="flex items-center gap-2 text-sm" key={stage.id}>
                  <i
                    className={`h-2 w-2 rounded-full ${stage.status === "COMPLETED" ? "bg-emerald-400" : stage.status === "IN_PROGRESS" ? "bg-indigo-400" : "bg-white/20"}`}
                  />
                  {stage.name}
                </li>
              ))}
            </ol>
          )}
          {admin && (
            <div className="mt-5 grid gap-3 border-t border-white/8 pt-5 sm:grid-cols-2">
              <label className="label">
                Status
                <select
                  className="input"
                  value={p.status}
                  onChange={(event) =>
                    update.mutate({ id: p.id, data: { status: event.target.value } })
                  }
                >
                  {[
                    "NEW",
                    "PLANNING",
                    "DESIGN",
                    "DEVELOPMENT",
                    "TESTING",
                    "REVIEW",
                    "COMPLETED",
                    "PAUSED",
                    "CANCELLED"
                  ].map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label className="label">
                Progress
                <input
                  className="input"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={p.progress}
                  onBlur={(event) =>
                    update.mutate({ id: p.id, data: { progress: Number(event.target.value) } })
                  }
                />
              </label>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
export function PaymentsContent() {
  const [proofs, setProofs] = useState<Record<string, File | undefined>>({});
  const client = useQueryClient();
  const q = useQuery({
    queryKey: ["payments"],
    queryFn: async () => (await api.get<{ data: Payment[] }>("/client/payments")).data.data
  });
  const details = useQuery({
    queryKey: ["payment-details"],
    queryFn: async () =>
      (
        await api.get<{
          data: {
            accountHolder: string;
            bankName: string;
            iban: string;
            currency: string;
            paymentInstructions: string;
          } | null;
        }>("/client/payment-details")
      ).data.data
  });
  const paid = useMutation({
    mutationFn: async (payment: Payment) => {
      const proof = proofs[payment.id];
      let proofFileId: string | undefined;
      if (proof) {
        const form = new FormData();
        form.append("file", proof);
        form.append("projectId", payment.projectId);
        const uploaded = await api.post<{ data: { id: string } }>("/files", form, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        proofFileId = uploaded.data.data.id;
      }
      return api.post(`/client/payments/${payment.id}/paid`, { proofFileId });
    },
    onSuccess: () => {
      toast.success("Payment submitted for confirmation.");
      void client.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: () => toast.error("Couldn’t update the payment. Try again.")
  });
  if (!q.data?.length) return <State pending={q.isPending} error={q.isError} empty={true} />;
  return (
    <div className="mt-7 grid gap-4">
      {details.data && (
        <article className="glass card">
          <h2 className="font-bold">Manual bank transfer</h2>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="muted">Account holder</dt>
              <dd>{details.data.accountHolder}</dd>
            </div>
            <div>
              <dt className="muted">Bank</dt>
              <dd>{details.data.bankName}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="muted">IBAN</dt>
              <dd className="mt-1 break-all font-mono">{details.data.iban}</dd>
            </div>
          </dl>
          <p className="muted mt-4 text-sm">{details.data.paymentInstructions}</p>
        </article>
      )}
      {q.data.map((p) => (
        <article
          className="glass card flex flex-wrap items-center justify-between gap-5"
          key={p.id}
        >
          <div>
            <span className={`pill ${statusTone(p.status)}`}>{humanize(p.status)}</span>
            <h2 className="mt-3 font-bold">{p.purpose}</h2>
            <p className="muted mt-1 text-sm">{p.paymentNumber}</p>
          </div>
          <div className="text-right">
            <b className="text-xl">{money(p.amount, p.currency)}</b>
            {p.status === "PENDING" && (
              <div className="mt-3 grid justify-items-end gap-2">
                <label className="muted text-xs">
                  Payment proof (optional)
                  <input
                    className="mt-1 block max-w-64 text-xs"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={(event) =>
                      setProofs((current) => ({
                        ...current,
                        [p.id]: event.target.files?.[0]
                      }))
                    }
                  />
                </label>
                <button
                  className="button button-primary"
                  disabled={paid.isPending}
                  onClick={() => paid.mutate(p)}
                >
                  {paid.isPending ? <LoadingLabel>Submitting</LoadingLabel> : "I have paid"}
                </button>
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
export function InvoicesContent() {
  const q = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => (await api.get<{ data: Invoice[] }>("/client/invoices")).data.data
  });
  if (!q.data?.length) return <State pending={q.isPending} error={q.isError} empty={true} />;
  return (
    <div className="mt-7 grid gap-4">
      {q.data.map((i) => (
        <article
          className="glass card flex flex-wrap items-center justify-between gap-5"
          key={i.id}
        >
          <div>
            <span className={`pill ${statusTone(i.status)}`}>{humanize(i.status)}</span>
            <h2 className="mt-3 font-bold">{i.invoiceNumber}</h2>
            <p className="muted mt-1 text-sm">{i.description}</p>
          </div>
          <div className="text-right">
            <b>{money(i.total, i.currency)}</b>
            <a
              className="button button-ghost mt-3 block"
              href={`${api.defaults.baseURL}/client/invoices/${i.id}/pdf`}
            >
              <Download size={16} />
              PDF
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}
export function AdminPaymentsContent() {
  const client = useQueryClient();
  const payments = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => (await api.get<{ data: Payment[] }>("/client/payments")).data.data
  });
  const projects = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => (await api.get<{ data: Project[] }>("/client/projects")).data.data
  });
  const createPayment = useMutation({
    mutationFn: (form: FormData) =>
      api.post("/admin/payments", {
        projectId: formText(form, "projectId"),
        amount: Math.round(Number(form.get("amount")) * 100),
        currency: formText(form, "currency"),
        purpose: formText(form, "purpose"),
        dueDate: form.get("dueDate") ? new Date(formText(form, "dueDate")).toISOString() : undefined
      }),
    onSuccess: () => {
      toast.success("Payment request created.");
      void client.invalidateQueries({ queryKey: ["admin-payments"] });
    },
    onError: () => toast.error("Couldn’t create the payment request. Try again.")
  });
  const confirmPayment = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      api.patch(`/admin/payments/${id}/confirm`, { approved }),
    onSuccess: () => {
      toast.success("Payment status updated.");
      void client.invalidateQueries({ queryKey: ["admin-payments"] });
    },
    onError: () => toast.error("Couldn’t update the payment status. Try again.")
  });
  return (
    <div className="mt-7 grid gap-4">
      <form
        className="glass card grid gap-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          createPayment.mutate(new FormData(event.currentTarget));
        }}
      >
        <h2 className="text-lg font-bold md:col-span-2">Create payment request</h2>
        <label className="label">
          Project
          <select className="input" name="projectId" required>
            <option value="">Select a project</option>
            {projects.data?.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <label className="label">
          Amount
          <input className="input" name="amount" type="number" min="0.01" step="0.01" required />
        </label>
        <label className="label">
          Currency
          <input className="input" name="currency" defaultValue="USD" maxLength={3} required />
        </label>
        <label className="label">
          Due date
          <input className="input" name="dueDate" type="date" />
        </label>
        <label className="label md:col-span-2">
          Purpose
          <input className="input" name="purpose" minLength={3} required />
        </label>
        <button className="button button-primary md:col-span-2" disabled={createPayment.isPending}>
          {createPayment.isPending ? <LoadingLabel>Creating</LoadingLabel> : "Create payment"}
        </button>
      </form>
      {!payments.data?.length ? (
        <State pending={payments.isPending} error={payments.isError} empty={true} />
      ) : (
        payments.data.map((payment) => (
          <article
            className="glass card flex flex-wrap items-center justify-between gap-5"
            key={payment.id}
          >
            <div>
              <span className={`pill ${statusTone(payment.status)}`}>
                {humanize(payment.status)}
              </span>
              <h2 className="mt-3 font-bold">{payment.purpose}</h2>
              <p className="muted mt-1 text-sm">{payment.paymentNumber}</p>
            </div>
            <div className="text-right">
              <b>{money(payment.amount, payment.currency)}</b>
              {payment.status === "WAITING_CONFIRMATION" && (
                <div className="mt-3 flex gap-2">
                  <button
                    className="button button-primary"
                    disabled={confirmPayment.isPending}
                    onClick={() => confirmPayment.mutate({ id: payment.id, approved: true })}
                  >
                    <Check size={16} /> Confirm
                  </button>
                  <button
                    className="button button-ghost"
                    disabled={confirmPayment.isPending}
                    onClick={() => confirmPayment.mutate({ id: payment.id, approved: false })}
                  >
                    <X size={16} /> Reject
                  </button>
                </div>
              )}
            </div>
          </article>
        ))
      )}
    </div>
  );
}
export function AdminInvoicesContent() {
  const client = useQueryClient();
  const invoices = useQuery({
    queryKey: ["admin-invoices"],
    queryFn: async () => (await api.get<{ data: Invoice[] }>("/client/invoices")).data.data
  });
  const projects = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => (await api.get<{ data: Project[] }>("/client/projects")).data.data
  });
  const createInvoice = useMutation({
    mutationFn: (form: FormData) =>
      api.post("/admin/invoices", {
        projectId: formText(form, "projectId"),
        description: formText(form, "description"),
        currency: formText(form, "currency"),
        dueDate: new Date(formText(form, "dueDate")).toISOString(),
        tax: Math.round(Number(form.get("tax") || 0) * 100),
        items: [
          {
            description: formText(form, "itemDescription"),
            quantity: Number(form.get("quantity")),
            unitPrice: Math.round(Number(form.get("unitPrice")) * 100)
          }
        ]
      }),
    onSuccess: () => {
      toast.success("Invoice created.");
      void client.invalidateQueries({ queryKey: ["admin-invoices"] });
    },
    onError: () => toast.error("Couldn’t create the invoice. Try again.")
  });
  const markPaid = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/invoices/${id}/paid`),
    onSuccess: () => {
      toast.success("Invoice marked as paid.");
      void client.invalidateQueries({ queryKey: ["admin-invoices"] });
    },
    onError: () => toast.error("Couldn’t update the invoice. Try again.")
  });
  return (
    <div className="mt-7 grid gap-4">
      <form
        className="glass card grid gap-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          createInvoice.mutate(new FormData(event.currentTarget));
        }}
      >
        <h2 className="text-lg font-bold md:col-span-2">Create invoice</h2>
        <label className="label">
          Project
          <select className="input" name="projectId" required>
            <option value="">Select a project</option>
            {projects.data?.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <label className="label">
          Due date
          <input className="input" name="dueDate" type="date" required />
        </label>
        <label className="label md:col-span-2">
          Invoice description
          <input className="input" name="description" minLength={3} required />
        </label>
        <label className="label">
          Item
          <input className="input" name="itemDescription" minLength={2} required />
        </label>
        <label className="label">
          Quantity
          <input
            className="input"
            name="quantity"
            type="number"
            min="1"
            max="1000"
            defaultValue="1"
            required
          />
        </label>
        <label className="label">
          Unit price
          <input className="input" name="unitPrice" type="number" min="0.01" step="0.01" required />
        </label>
        <label className="label">
          Tax
          <input className="input" name="tax" type="number" min="0" step="0.01" defaultValue="0" />
        </label>
        <label className="label">
          Currency
          <input className="input" name="currency" defaultValue="USD" maxLength={3} required />
        </label>
        <button className="button button-primary self-end" disabled={createInvoice.isPending}>
          {createInvoice.isPending ? <LoadingLabel>Creating</LoadingLabel> : "Create invoice"}
        </button>
      </form>
      {!invoices.data?.length ? (
        <State pending={invoices.isPending} error={invoices.isError} empty={true} />
      ) : (
        invoices.data.map((invoice) => (
          <article
            className="glass card flex flex-wrap items-center justify-between gap-5"
            key={invoice.id}
          >
            <div>
              <span className={`pill ${statusTone(invoice.status)}`}>
                {humanize(invoice.status)}
              </span>
              <h2 className="mt-3 font-bold">{invoice.invoiceNumber}</h2>
              <p className="muted mt-1 text-sm">{invoice.description}</p>
            </div>
            <div className="text-right">
              <b>{money(invoice.total, invoice.currency)}</b>
              {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
                <button
                  className="button button-primary mt-3 block"
                  onClick={() => markPaid.mutate(invoice.id)}
                >
                  Mark as paid
                </button>
              )}
            </div>
          </article>
        ))
      )}
    </div>
  );
}
export function NotificationsContent() {
  const client = useQueryClient();
  const q = useQuery({
    queryKey: ["notifications"],
    queryFn: async () =>
      (await api.get<{ data: Notification[] }>("/client/notifications")).data.data
  });
  const update = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "read" | "delete" }) =>
      action === "read"
        ? api.patch(`/client/notifications/${id}/read`)
        : api.delete(`/client/notifications/${id}`),
    onSuccess: () => void client.invalidateQueries({ queryKey: ["notifications"] }),
    onError: () => toast.error("Couldn’t update the notification. Try again.")
  });
  if (!q.data?.length) return <State pending={q.isPending} error={q.isError} empty={true} />;
  return (
    <div className="mt-7 grid gap-3">
      {q.data.map((n) => (
        <article className={`glass card ${n.readAt ? "opacity-65" : ""}`} key={n.id}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-bold">{n.title}</h2>
              <p className="muted mt-1 text-sm">{n.message}</p>
              <time className="muted mt-3 block text-xs">
                {new Date(n.createdAt).toLocaleString()}
              </time>
            </div>
            <div className="flex gap-2">
              {!n.readAt && (
                <button
                  className="button button-ghost px-3"
                  aria-label={`Mark ${n.title} as read`}
                  onClick={() => update.mutate({ id: n.id, action: "read" })}
                >
                  <Check size={16} />
                </button>
              )}
              <button
                className="button button-ghost px-3"
                aria-label={`Delete ${n.title}`}
                onClick={() => update.mutate({ id: n.id, action: "delete" })}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
export function MessagesContent({ admin = false }: { admin?: boolean }) {
  const [selectedId, setSelectedId] = useState<string>();
  const client = useQueryClient();
  const q = useQuery({
    queryKey: ["conversations"],
    queryFn: async () =>
      (await api.get<{ data: Conversation[] }>("/messages/conversations")).data.data
  });
  const clients = useQuery({
    queryKey: ["admin", "conversation-clients"],
    enabled: admin,
    queryFn: async () =>
      (await api.get<{ data: { id: string; name: string; email: string }[] }>("/admin/clients"))
        .data.data
  });
  const detail = useQuery({
    queryKey: ["conversation", selectedId],
    enabled: Boolean(selectedId),
    queryFn: async () =>
      (await api.get<{ data: ConversationDetail }>(`/messages/conversations/${String(selectedId)}`))
        .data.data
  });
  const createConversation = useMutation({
    mutationFn: ({ subject, participantId }: { subject: string; participantId?: string }) =>
      api.post("/messages/conversations", { subject, participantId }),
    onSuccess: (response) => {
      const id = (response.data as { data: { id: string } }).data.id;
      setSelectedId(id);
      void client.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: () => toast.error("Couldn’t start the conversation. Try again.")
  });
  const sendMessage = useMutation({
    mutationFn: (content: string) =>
      api.post(`/messages/conversations/${String(selectedId)}/messages`, { content }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["conversation", selectedId] });
      void client.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: () => toast.error("Couldn’t send the message. Try again.")
  });
  if (q.isPending || q.isError)
    return <State pending={q.isPending} error={q.isError} empty={false} />;
  return (
    <div className="mt-7 grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <div className="grid content-start gap-3">
        <form
          className="glass card flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            const participantId = formText(data, "participantId");
            createConversation.mutate(
              {
                subject: formText(data, "subject"),
                ...(participantId ? { participantId } : {})
              },
              { onSuccess: () => form.reset() }
            );
          }}
        >
          {admin && (
            <select
              className="input max-w-48"
              name="participantId"
              aria-label="Conversation client"
              required
            >
              <option value="">Select client</option>
              {clients.data?.map((clientItem) => (
                <option key={clientItem.id} value={clientItem.id}>
                  {clientItem.name}
                </option>
              ))}
            </select>
          )}
          <input
            className="input"
            name="subject"
            minLength={3}
            maxLength={150}
            placeholder="New conversation subject"
            aria-label="New conversation subject"
            required
          />
          <button className="button button-primary px-4" disabled={createConversation.isPending}>
            New
          </button>
        </form>
        {!q.data?.length && <State pending={false} error={false} empty={true} />}
        {q.data?.map((conversation) => (
          <button
            className={`glass card interactive-card flex items-center justify-between gap-4 text-left ${
              selectedId === conversation.id ? "border-indigo-400/40" : ""
            }`}
            key={conversation.id}
            aria-pressed={selectedId === conversation.id}
            onClick={() => setSelectedId(conversation.id)}
          >
            <span>
              <b className="block">{conversation.subject}</b>
              <span className="muted mt-2 line-clamp-2 text-sm">
                {conversation.messages[0]?.content ?? "No messages yet"}
              </span>
            </span>
            <Send size={18} className="shrink-0 text-indigo-300" />
          </button>
        ))}
      </div>
      <section className="glass card min-h-80">
        {!selectedId ? (
          <div className="grid min-h-64 place-items-center text-center">
            <div>
              <h2 className="font-bold">Select a conversation</h2>
              <p className="muted mt-2 text-sm">Messages and attachments will appear here.</p>
            </div>
          </div>
        ) : detail.isPending ? (
          <LoadingState title="Loading conversation" />
        ) : detail.isError || !detail.data ? (
          <ErrorState title="Unable to load this conversation" />
        ) : (
          <>
            <h2 className="text-lg font-bold">{detail.data.subject}</h2>
            <div className="mt-5 grid max-h-[28rem] gap-3 overflow-y-auto">
              {detail.data.messages.map((message) => (
                <article className="rounded-2xl bg-white/5 p-4" key={message.id}>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <b>{message.sender.name}</b>
                    <time className="muted">{new Date(message.createdAt).toLocaleString()}</time>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{message.content}</p>
                </article>
              ))}
              {!detail.data.messages.length && (
                <p className="muted text-sm">No messages yet. Start the conversation below.</p>
              )}
            </div>
            <form
              className="mt-5 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const form = event.currentTarget;
                const content = formText(new FormData(form), "content");
                sendMessage.mutate(content, { onSuccess: () => form.reset() });
              }}
            >
              <textarea
                className="input min-h-12"
                name="content"
                maxLength={5000}
                placeholder="Write a message"
                aria-label="Message"
                required
              />
              <button className="button button-primary self-end" disabled={sendMessage.isPending}>
                {sendMessage.isPending ? (
                  <LoadingLabel>Sending</LoadingLabel>
                ) : (
                  <>
                    <Send size={17} /> Send
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
export function FilesContent({ admin = false }: { admin?: boolean }) {
  const [file, setFile] = useState<File>();
  const client = useQueryClient();
  const filesQuery = useQuery({
    queryKey: ["files"],
    queryFn: async () =>
      (
        await api.get<{
          data: {
            id: string;
            name: string;
            mimeType: string;
            size: number;
            category: string;
            clientVisible: boolean;
            createdAt: string;
          }[];
        }>("/files")
      ).data.data
  });
  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Select a file");
      const data = new FormData();
      data.append("file", file);
      return api.post("/files", data, { headers: { "Content-Type": "multipart/form-data" } });
    },
    onSuccess: () => {
      toast.success("File uploaded.");
      setFile(undefined);
      void client.invalidateQueries({ queryKey: ["files"] });
    },
    onError: () => toast.error("Couldn’t upload the file. Try again.")
  });
  const access = useMutation({
    mutationFn: ({ id, clientVisible }: { id: string; clientVisible: boolean }) =>
      api.patch(`/files/${id}/access`, { clientVisible }),
    onSuccess: () => {
      toast.success("File access updated.");
      void client.invalidateQueries({ queryKey: ["files"] });
    },
    onError: () => toast.error("Couldn’t update file access. Try again.")
  });
  return (
    <div className="mt-7 grid gap-4">
      <div className="glass card">
        <h2 className="font-bold">Upload a project file</h2>
        <p className="muted mt-2 text-sm">PDF, PNG, JPEG, WebP, TXT or ZIP. Maximum size 10 MB.</p>
        <form
          className="mt-5 flex flex-wrap gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            upload.mutate();
          }}
        >
          <input
            className="input max-w-md"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.zip"
            onChange={(event) => setFile(event.target.files?.[0])}
          />
          <button className="button button-primary" disabled={!file || upload.isPending}>
            {upload.isPending ? <LoadingLabel>Uploading</LoadingLabel> : "Upload"}
          </button>
        </form>
      </div>
      {!filesQuery.data?.length && (
        <State
          pending={filesQuery.isPending}
          error={filesQuery.isError}
          empty={true}
          emptyTitle="No files yet"
          emptyDescription="Project files shared with you will appear here."
        />
      )}
      {filesQuery.data?.map((item) => (
        <article
          className="glass card flex flex-wrap items-center justify-between gap-4"
          key={item.id}
        >
          <div>
            <h3 className="font-semibold">{item.name}</h3>
            <p className="muted mt-1 text-xs">
              {humanize(item.category)} · {(item.size / 1024).toFixed(1)} KB ·{" "}
              {new Date(item.createdAt).toLocaleDateString()}
            </p>
          </div>
          <a
            className="button button-ghost"
            href={`${api.defaults.baseURL}/files/${item.id}/download`}
          >
            <Download size={16} />
            Download
          </a>
          {admin && (
            <button
              className="button button-ghost"
              onClick={() => access.mutate({ id: item.id, clientVisible: !item.clientVisible })}
            >
              {item.clientVisible ? "Hide from client" : "Share with client"}
            </button>
          )}
        </article>
      ))}
    </div>
  );
}
export function AdminOrdersContent() {
  const client = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () =>
      (await api.get<{ data: { items: Order[] } }>("/admin/orders")).data.data.items
  });
  const clients = useQuery({
    queryKey: ["admin", "order-clients"],
    queryFn: async () =>
      (await api.get<{ data: { id: string; name: string; email: string }[] }>("/admin/clients"))
        .data.data
  });
  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/admin/orders/${id}`, { status }),
    onSuccess: () => {
      toast.success("Order status updated.");
      void client.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: () => toast.error("Couldn’t update the order. Try again.")
  });
  const convert = useMutation({
    mutationFn: ({ id, form }: { id: string; form: FormData }) =>
      api.post(`/admin/orders/${id}/convert`, {
        clientId: formText(form, "clientId"),
        budget: Math.round(Number(form.get("budget")) * 100),
        currency: formText(form, "currency")
      }),
    onSuccess: () => {
      toast.success("Order converted to a project.");
      void client.invalidateQueries({ queryKey: ["admin-orders"] });
      void client.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: () => toast.error("Couldn’t convert the order. Try again.")
  });
  if (!q.data?.length) return <State pending={q.isPending} error={q.isError} empty={true} />;
  return (
    <div className="mt-7 overflow-hidden rounded-3xl border border-white/10">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-white/5 text-[#a8aabc]">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {q.data.map((o) => (
              <tr className="border-t border-white/8" key={o.id}>
                <td className="px-4 py-3 font-semibold">{o.orderNumber}</td>
                <td className="px-4 py-3">
                  {o.projectName}
                  <span className="muted block text-xs">
                    {o.projectType} · {humanize(o.buildApproach)}
                  </span>
                  {o.estimatedPriceCents !== null && (
                    <span className="mt-1 block text-xs text-indigo-200">
                      Estimate {money(o.estimatedPriceCents, "USD")}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {o.contactName}
                  <span className="muted block text-xs">{o.contactEmail}</span>
                </td>
                <td className="px-4 py-3">
                  <select
                    aria-label={`Status for ${o.orderNumber}`}
                    className="input min-w-36 py-2 text-xs"
                    value={o.status}
                    onChange={(event) => update.mutate({ id: o.id, status: event.target.value })}
                    disabled={update.isPending}
                  >
                    {[
                      "NEW",
                      "CONTACTED",
                      "DISCUSSION",
                      "ESTIMATION",
                      "ACCEPTED",
                      "REJECTED",
                      "CANCELLED"
                    ].map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {["ACCEPTED", "ESTIMATION"].includes(o.status) ? (
                    <form
                      className="grid min-w-64 grid-cols-2 gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        convert.mutate({ id: o.id, form: new FormData(event.currentTarget) });
                      }}
                    >
                      <select className="input col-span-2 py-2 text-xs" name="clientId" required>
                        <option value="">Select client</option>
                        {clients.data?.map((clientItem) => (
                          <option key={clientItem.id} value={clientItem.id}>
                            {clientItem.name}
                          </option>
                        ))}
                      </select>
                      <input
                        className="input py-2 text-xs"
                        name="budget"
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="Budget"
                        required
                      />
                      <input
                        className="input py-2 text-xs"
                        name="currency"
                        defaultValue="USD"
                        maxLength={3}
                        required
                      />
                      <button
                        className="button button-primary col-span-2 py-2 text-xs"
                        disabled={convert.isPending}
                      >
                        Convert to project
                      </button>
                    </form>
                  ) : (
                    <span className="muted text-xs">Set Estimation to convert</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export function ClientOrdersContent() {
  const query = useQuery({
    queryKey: ["client-orders"],
    queryFn: async () => (await api.get<{ data: Order[] }>("/client/orders")).data.data
  });
  if (!query.data?.length)
    return <State pending={query.isPending} error={query.isError} empty={true} />;
  return (
    <div className="mt-7 grid gap-4">
      {query.data.map((order) => (
        <article className="glass card" key={order.id}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="pill">{order.status}</span>
              <h2 className="mt-3 font-bold">{order.projectName}</h2>
              <p className="muted mt-1 text-sm">
                {order.orderNumber} · {order.projectType}
              </p>
              {order.estimatedPriceCents !== null && (
                <p className="mt-2 text-sm text-indigo-200">
                  Planning estimate {money(order.estimatedPriceCents, "USD")}
                </p>
              )}
            </div>
            <time className="muted text-sm">{new Date(order.createdAt).toLocaleDateString()}</time>
          </div>
        </article>
      ))}
    </div>
  );
}

export function AdminListContent({
  resource
}: {
  resource: "clients" | "reviews" | "services" | "portfolio" | "audit-logs";
}) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["admin", resource],
    queryFn: async () =>
      (await api.get<{ data: Record<string, unknown>[] }>(`/admin/${resource}`)).data.data
  });
  const moderate = useMutation({
    mutationFn: ({
      id,
      action,
      currentStatus
    }: {
      id: string;
      action: "review" | "client";
      currentStatus: string;
    }) =>
      action === "review"
        ? api.patch(`/reviews/${id}/status`, {
            status: currentStatus === "APPROVED" ? "REJECTED" : "APPROVED"
          })
        : api.patch(`/admin/clients/${id}/access`, {
            status: currentStatus === "BLOCKED" ? "ACTIVE" : "BLOCKED"
          }),
    onSuccess: () => {
      toast.success("Record updated.");
      void client.invalidateQueries({ queryKey: ["admin", resource] });
    },
    onError: () => toast.error("Couldn’t update the record. Try again.")
  });
  if (!query.data?.length)
    return <State pending={query.isPending} error={query.isError} empty={true} />;
  return (
    <div className="mt-7 grid gap-3">
      {query.data.map((item, index) => {
        const id = typeof item.id === "string" ? item.id : `${resource}-${index}`;
        const title =
          [item.name, item.title, item.action].find((value) => typeof value === "string") ??
          "Record";
        const detail =
          [item.email, item.message, item.entityType, item.status]
            .filter((value) => typeof value === "string")
            .join(" · ") || "No additional details";
        return (
          <article className="glass card" key={id}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold">{String(title)}</h2>
                <p className="muted mt-2 text-sm">{detail}</p>
              </div>
              {resource === "reviews" && typeof item.status === "string" && (
                <button
                  className="button button-ghost"
                  onClick={() =>
                    moderate.mutate({
                      id,
                      action: "review",
                      currentStatus: item.status as string
                    })
                  }
                >
                  {item.status === "APPROVED" ? "Reject" : "Approve"}
                </button>
              )}
              {resource === "clients" && typeof item.status === "string" && (
                <button
                  className="button button-ghost"
                  onClick={() =>
                    moderate.mutate({
                      id,
                      action: "client",
                      currentStatus: item.status as string
                    })
                  }
                >
                  {item.status === "BLOCKED" ? "Unblock" : "Block account"}
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function BankSettingsContent() {
  const mutation = useMutation({
    mutationFn: (data: Record<string, string>) => api.put("/admin/settings/bank-details", data),
    onSuccess: () => toast.success("Bank details saved."),
    onError: () => toast.error("Couldn’t save bank details. Try again.")
  });
  return (
    <form
      className="glass card mt-7 grid gap-5 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate(
          Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>
        );
      }}
    >
      <p className="muted text-sm sm:col-span-2">
        Sensitive values are encrypted server-side and are shown only in masked form after saving.
      </p>
      <label className="label">
        Account holder
        <input className="input" name="accountHolder" required />
      </label>
      <label className="label">
        Bank name
        <input className="input" name="bankName" required />
      </label>
      <label className="label">
        IBAN
        <input className="input" name="iban" autoComplete="off" required />
      </label>
      <label className="label">
        Card number (optional)
        <input className="input" name="cardNumber" autoComplete="off" />
      </label>
      <label className="label">
        Currency
        <input className="input" name="currency" defaultValue="USD" maxLength={3} required />
      </label>
      <label className="label sm:col-span-2">
        Payment instructions
        <textarea className="input" name="paymentInstructions" required />
      </label>
      <button className="button button-primary sm:col-span-2" disabled={mutation.isPending}>
        {mutation.isPending ? <LoadingLabel>Saving</LoadingLabel> : "Save bank details"}
      </button>
    </form>
  );
}

export function ProfileContent() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () =>
      (
        await api.get<{
          data: {
            name: string;
            firstName: string | null;
            lastName: string | null;
            email: string;
            telegram: string | null;
            discord: string | null;
            country: string | null;
            phone: string | null;
            companyName: string | null;
            billingAddressLine1: string | null;
            billingAddressLine2: string | null;
            billingCity: string | null;
            billingRegion: string | null;
            billingPostalCode: string | null;
            billingCountry: string | null;
            taxId: string | null;
          };
        }>("/auth/me")
      ).data.data
  });
  const mutation = useMutation({
    mutationFn: (data: Record<string, string>) => api.patch("/users/me", data),
    onSuccess: () => {
      toast.success("Profile and billing details updated.");
      void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
    onError: () => toast.error("Couldn’t update your profile. Try again.")
  });
  if (!query.data) return <State pending={query.isPending} error={query.isError} empty={false} />;
  return (
    <form
      className="glass card mt-7 grid gap-5 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate(
          Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>
        );
      }}
    >
      <label className="label">
        First name
        <input
          className="input"
          name="firstName"
          autoComplete="given-name"
          defaultValue={query.data.firstName ?? query.data.name.split(" ")[0]}
          required
        />
      </label>
      <label className="label">
        Last name
        <input
          className="input"
          name="lastName"
          autoComplete="family-name"
          defaultValue={query.data.lastName ?? query.data.name.split(" ").slice(1).join(" ")}
          required
        />
      </label>
      <label className="label">
        Email
        <input className="input opacity-60" value={query.data.email} disabled />
      </label>
      <label className="label">
        Phone
        <input
          className="input"
          name="phone"
          type="tel"
          autoComplete="tel"
          defaultValue={query.data.phone ?? ""}
        />
      </label>
      <label className="label">
        Company
        <input
          className="input"
          name="companyName"
          autoComplete="organization"
          defaultValue={query.data.companyName ?? ""}
        />
      </label>
      <div className="border-t border-white/10 pt-5 sm:col-span-2">
        <h2 className="font-bold">Billing details</h2>
        <p className="muted mt-2 text-sm">
          Used as the source for future contracts, receipts and invoices.
        </p>
      </div>
      <label className="label sm:col-span-2">
        Street and number
        <input
          className="input"
          name="billingAddressLine1"
          autoComplete="address-line1"
          defaultValue={query.data.billingAddressLine1 ?? ""}
        />
      </label>
      <label className="label sm:col-span-2">
        Apartment, suite or unit
        <input
          className="input"
          name="billingAddressLine2"
          autoComplete="address-line2"
          defaultValue={query.data.billingAddressLine2 ?? ""}
        />
      </label>
      <label className="label">
        City
        <input
          className="input"
          name="billingCity"
          autoComplete="address-level2"
          defaultValue={query.data.billingCity ?? ""}
        />
      </label>
      <label className="label">
        State or region
        <input
          className="input"
          name="billingRegion"
          autoComplete="address-level1"
          defaultValue={query.data.billingRegion ?? ""}
        />
      </label>
      <label className="label">
        Postal code
        <input
          className="input"
          name="billingPostalCode"
          autoComplete="postal-code"
          defaultValue={query.data.billingPostalCode ?? ""}
        />
      </label>
      <label className="label">
        Billing country
        <input
          className="input"
          name="billingCountry"
          autoComplete="country-name"
          defaultValue={query.data.billingCountry ?? query.data.country ?? ""}
        />
      </label>
      <label className="label">
        VAT / Tax ID
        <input
          className="input"
          name="taxId"
          autoComplete="off"
          defaultValue={query.data.taxId ?? ""}
        />
      </label>
      <details className="rounded-xl border border-white/10 p-4 sm:col-span-2">
        <summary className="cursor-pointer font-semibold">Messaging profiles</summary>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <label className="label">
            Telegram
            <input className="input" name="telegram" defaultValue={query.data.telegram ?? ""} />
          </label>
          <label className="label">
            Discord
            <input className="input" name="discord" defaultValue={query.data.discord ?? ""} />
          </label>
        </div>
      </details>
      <input
        type="hidden"
        name="country"
        value={query.data.country ?? query.data.billingCountry ?? ""}
      />
      <button className="button button-primary sm:col-span-2" disabled={mutation.isPending}>
        {mutation.isPending ? <LoadingLabel>Saving</LoadingLabel> : "Save profile"}
      </button>
    </form>
  );
}
