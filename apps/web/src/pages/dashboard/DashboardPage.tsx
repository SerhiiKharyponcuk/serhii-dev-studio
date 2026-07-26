import {
  Bell,
  CreditCard,
  Files,
  FolderKanban,
  LayoutDashboard,
  MessageSquare,
  Receipt,
  Settings
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router";
import { api } from "../../lib/api";
import { AdminStatsChart } from "../../features/dashboard/AdminStatsChart";
import {
  AdminOrdersContent,
  AdminInvoicesContent,
  AdminListContent,
  AdminPaymentsContent,
  BankSettingsContent,
  ClientOrdersContent,
  FilesContent,
  InvoicesContent,
  MessagesContent,
  NotificationsContent,
  PaymentsContent,
  ProfileContent,
  ProjectsContent
} from "../../features/dashboard/DashboardContent";

const items = [
  ["Overview", "/dashboard", LayoutDashboard],
  ["My Projects", "/dashboard/projects", FolderKanban],
  ["Orders", "/dashboard/orders", Receipt],
  ["Payments", "/dashboard/payments", CreditCard],
  ["Invoices", "/dashboard/invoices", Receipt],
  ["Messages", "/dashboard/messages", MessageSquare],
  ["Files", "/dashboard/files", Files],
  ["Notifications", "/dashboard/notifications", Bell],
  ["Profile", "/dashboard/profile", Settings],
  ["Support", "/dashboard/support", MessageSquare]
] as const;
const adminItems = [
  ["Dashboard", "/admin", LayoutDashboard],
  ["Orders", "/admin/orders", Receipt],
  ["Clients", "/admin/clients", Settings],
  ["Projects", "/admin/projects", FolderKanban],
  ["Payments", "/admin/payments", CreditCard],
  ["Invoices", "/admin/invoices", Receipt],
  ["Messages", "/admin/messages", MessageSquare],
  ["Files", "/admin/files", Files],
  ["Reviews", "/admin/reviews", Receipt],
  ["Services", "/admin/services", Settings],
  ["Portfolio", "/admin/portfolio", FolderKanban],
  ["Notifications", "/admin/notifications", Bell],
  ["Settings", "/admin/settings", Settings],
  ["Audit Logs", "/admin/audit-logs", Receipt]
] as const;
export function DashboardPage({ admin = false }: { admin?: boolean }) {
  const { pathname } = useLocation();
  const navigation = admin ? adminItems : items;
  const label =
    navigation.find((x) => x[1] === pathname)?.[0] ??
    (admin ? "Admin dashboard" : "Client dashboard");
  const query = useQuery({
    queryKey: [admin ? "admin-dashboard" : "client-overview"],
    queryFn: async () => {
      const response = await api.get<{ data: unknown }>(
        admin ? "/admin/dashboard" : "/client/overview"
      );
      return response.data.data;
    }
  });
  const stats =
    admin && query.data && typeof query.data === "object"
      ? (query.data as Record<string, unknown>)
      : null;
  const clientStats =
    !admin && query.data && typeof query.data === "object"
      ? (query.data as Record<string, unknown>)
      : null;
  const numberStat = (key: string) => (typeof stats?.[key] === "number" ? stats[key] : 0);
  const pendingPayments =
    stats?.pendingPayments &&
    typeof stats.pendingPayments === "object" &&
    typeof (stats.pendingPayments as Record<string, unknown>)._count === "number"
      ? (stats.pendingPayments as { _count: number })._count
      : 0;
  const cards: Array<[string, string | number]> = admin
    ? [
        ["Clients", numberStat("clients")],
        ["New orders", numberStat("newOrders")],
        ["Active projects", numberStat("activeProjects")],
        ["Pending payments", pendingPayments]
      ]
    : [
        [
          "Active projects",
          typeof clientStats?.activeProjects === "number" ? clientStats.activeProjects : 0
        ],
        [
          "Unread messages",
          typeof clientStats?.unreadMessages === "number" ? clientStats.unreadMessages : 0
        ],
        [
          "Open invoices",
          typeof clientStats?.openInvoices === "number" ? clientStats.openInvoices : 0
        ],
        ["Recent files", typeof clientStats?.recentFiles === "number" ? clientStats.recentFiles : 0]
      ];
  const section =
    admin && pathname.endsWith("/orders") ? (
      <AdminOrdersContent />
    ) : admin && pathname.endsWith("/clients") ? (
      <AdminListContent resource="clients" />
    ) : admin && pathname.endsWith("/reviews") ? (
      <AdminListContent resource="reviews" />
    ) : admin && pathname.endsWith("/services") ? (
      <AdminListContent resource="services" />
    ) : admin && pathname.endsWith("/portfolio") ? (
      <AdminListContent resource="portfolio" />
    ) : admin && pathname.endsWith("/settings") ? (
      <BankSettingsContent />
    ) : admin && pathname.endsWith("/audit-logs") ? (
      <AdminListContent resource="audit-logs" />
    ) : admin && pathname.endsWith("/projects") ? (
      <ProjectsContent admin />
    ) : admin && pathname.endsWith("/payments") ? (
      <AdminPaymentsContent />
    ) : admin && pathname.endsWith("/invoices") ? (
      <AdminInvoicesContent />
    ) : !admin && pathname.endsWith("/projects") ? (
      <ProjectsContent />
    ) : !admin && pathname.endsWith("/orders") ? (
      <ClientOrdersContent />
    ) : pathname.endsWith("/payments") ? (
      <PaymentsContent />
    ) : pathname.endsWith("/invoices") ? (
      <InvoicesContent />
    ) : admin && pathname.endsWith("/messages") ? (
      <MessagesContent admin />
    ) : pathname.endsWith("/messages") ? (
      <MessagesContent />
    ) : pathname.endsWith("/support") ? (
      <MessagesContent />
    ) : admin && pathname.endsWith("/files") ? (
      <FilesContent admin />
    ) : pathname.endsWith("/files") ? (
      <FilesContent />
    ) : pathname.endsWith("/notifications") ? (
      <NotificationsContent />
    ) : pathname.endsWith("/profile") ? (
      <ProfileContent />
    ) : null;
  return (
    <div className="dashboard-grid">
      <aside className="border-r border-white/8 p-5">
        <b>{admin ? "Studio Admin" : "Client workspace"}</b>
        <nav className="mt-7 grid gap-1">
          {navigation.map(([name, path, Icon]) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${pathname === path ? "bg-white/8 text-white" : "text-[#9295a7]"}`}
            >
              <Icon size={17} />
              {name}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="p-5 md:p-9">
        <p className="eyebrow">{admin ? "Operations" : "Workspace"}</p>
        <h1 className="mt-2 text-3xl font-bold">{label}</h1>
        {section ??
          (query.isPending ? (
            <div className="mt-8 h-32 animate-pulse rounded-3xl bg-white/5" />
          ) : query.isError ? (
            <div className="glass card mt-8 text-red-200">
              Dashboard data could not be loaded. Try again shortly.
            </div>
          ) : (
            <>
              <div className="grid-auto mt-8">
                {cards.map(([title, value]) => (
                  <article key={title} className="glass card">
                    <p className="muted text-sm">{title}</p>
                    <p className="mt-3 text-3xl font-bold">{value}</p>
                  </article>
                ))}
              </div>
              {admin && (
                <AdminStatsChart
                  values={{
                    clients: numberStat("clients"),
                    orders: numberStat("newOrders"),
                    projects: numberStat("activeProjects")
                  }}
                />
              )}
              <div className="glass card mt-6">
                <h2 className="text-lg font-bold">
                  {Number(cards[0]?.[1]) > 0 ? "Project workspace is ready" : "No items yet"}
                </h2>
                <p className="muted mt-2 text-sm">
                  {Number(cards[0]?.[1]) > 0
                    ? "Open My Projects to review current progress and milestones."
                    : "New project activity will be shown here as soon as it is created."}
                </p>
              </div>
            </>
          ))}
      </section>
    </div>
  );
}
