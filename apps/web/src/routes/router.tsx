import { createBrowserRouter } from "react-router";
import { lazy, Suspense } from "react";
import { PublicLayout } from "../layouts/PublicLayout";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";
import { LoadingState } from "../components/AsyncState";
import type { ReactNode } from "react";

const HomePage = lazy(async () => ({
  default: (await import("../pages/public/HomePage")).HomePage
}));
const DashboardPage = lazy(async () => {
  const module = await import("../pages/dashboard/DashboardPage");
  return { default: module.DashboardPage };
});
const contentModule = () => import("../pages/public/ContentPages");
const AboutPage = lazy(async () => ({ default: (await contentModule()).AboutPage }));
const ContactPage = lazy(async () => ({ default: (await contentModule()).ContactPage }));
const NotFound = lazy(async () => ({ default: (await contentModule()).NotFound }));
const PortfolioPage = lazy(async () => ({ default: (await contentModule()).PortfolioPage }));
const PricingPage = lazy(async () => ({ default: (await contentModule()).PricingPage }));
const ProjectPage = lazy(async () => ({ default: (await contentModule()).ProjectPage }));
const ServicePage = lazy(async () => ({ default: (await contentModule()).ServicePage }));
const ServicesPage = lazy(async () => ({ default: (await contentModule()).ServicesPage }));
const SimplePage = lazy(async () => ({ default: (await contentModule()).SimplePage }));
const OrderPage = lazy(async () => ({
  default: (await import("../pages/public/OrderPage")).OrderPage
}));
const ReviewsPage = lazy(async () => ({
  default: (await import("../pages/public/ReviewsPage")).ReviewsPage
}));
const AuthPage = lazy(async () => ({
  default: (await import("../pages/auth/AuthPages")).AuthPage
}));
const VerifyEmailPage = lazy(async () => ({
  default: (await import("../pages/auth/AuthPages")).VerifyEmailPage
}));
const AdminVerifyPage = lazy(async () => ({
  default: (await import("../pages/auth/AuthPages")).AdminVerifyPage
}));
const loadable = (content: ReactNode) => (
  <Suspense
    fallback={
      <div className="shell section">
        <LoadingState />
      </div>
    }
  >
    {content}
  </Suspense>
);
const dashboard = (admin = false) => (
  <Suspense
    fallback={
      <div className="shell section">
        <LoadingState />
      </div>
    }
  >
    <DashboardPage admin={admin} />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: loadable(<HomePage />) },
      { path: "/about", element: loadable(<AboutPage />) },
      { path: "/portfolio", element: loadable(<PortfolioPage />) },
      { path: "/portfolio/:slug", element: loadable(<ProjectPage />) },
      { path: "/services", element: loadable(<ServicesPage />) },
      { path: "/services/:slug", element: loadable(<ServicePage />) },
      { path: "/pricing", element: loadable(<PricingPage />) },
      { path: "/reviews", element: loadable(<ReviewsPage />) },
      { path: "/faq", element: loadable(<SimplePage kind="FAQ" />) },
      { path: "/contact", element: loadable(<ContactPage />) },
      { path: "/order", element: loadable(<OrderPage />) },
      { path: "/login", element: loadable(<AuthPage mode="login" />) },
      { path: "/register", element: loadable(<AuthPage mode="register" />) },
      { path: "/forgot-password", element: loadable(<AuthPage mode="forgot" />) },
      { path: "/resend-verification", element: loadable(<AuthPage mode="resend" />) },
      { path: "/reset-password", element: loadable(<AuthPage mode="reset" />) },
      { path: "/verify-email", element: loadable(<VerifyEmailPage />) },
      { path: "/admin/verify", element: loadable(<AdminVerifyPage />) },
      { path: "/privacy", element: loadable(<SimplePage kind="Privacy" />) },
      { path: "/terms", element: loadable(<SimplePage kind="Terms" />) },
      { path: "/cookies", element: loadable(<SimplePage kind="Cookies" />) },
      {
        element: <ProtectedRoute />,
        children: [{ path: "/dashboard/*", element: dashboard() }]
      },
      {
        element: <ProtectedRoute admin />,
        children: [{ path: "/admin/*", element: dashboard(true) }]
      },
      { path: "*", element: loadable(<NotFound />) }
    ]
  }
]);
