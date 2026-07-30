import { projects, services, site } from "./site";

export type SeoMetadata = {
  title: string;
  description: string;
  indexable: boolean;
  type: "website" | "article";
};

const publicPages: Record<string, Omit<SeoMetadata, "indexable" | "type">> = {
  "/": {
    title: `${site.name} — ${site.title}`,
    description: site.description
  },
  "/about": {
    title: `About — ${site.name}`,
    description: `Meet ${site.developer}, a frontend and full stack developer building reliable digital products from the Netherlands.`
  },
  "/portfolio": {
    title: `Selected Work — ${site.name}`,
    description:
      "Explore selected websites, web applications and commerce experiences built by Serhii Dev Studio."
  },
  "/services": {
    title: `Web Development Services — ${site.name}`,
    description:
      "Custom websites, web applications, online shops, dashboards, redesigns and ongoing technical support."
  },
  "/pricing": {
    title: `Pricing — ${site.name}`,
    description:
      "Transparent starting prices for landing pages, business websites and custom web applications."
  },
  "/reviews": {
    title: `Client Reviews — ${site.name}`,
    description: "Read what clients value about working with Serhii Dev Studio."
  },
  "/faq": {
    title: `Frequently Asked Questions — ${site.name}`,
    description:
      "Answers about project scope, timelines, pricing, communication, handover and ongoing support."
  },
  "/contact": {
    title: `Contact — ${site.name}`,
    description: "Tell Serhii Dev Studio about your project, goals and timeline."
  },
  "/order": {
    title: `Start a Project — ${site.name}`,
    description:
      "Share your project requirements and receive a tailored proposal from Serhii Dev Studio."
  },
  "/privacy": {
    title: `Privacy Policy — ${site.name}`,
    description:
      "How Serhii Dev Studio handles personal information submitted through this website."
  },
  "/terms": {
    title: `Terms of Service — ${site.name}`,
    description:
      "The terms governing use of the Serhii Dev Studio website and project enquiry services."
  },
  "/cookies": {
    title: `Cookie Policy — ${site.name}`,
    description: "Information about cookies and similar technologies used by Serhii Dev Studio."
  }
};

const privatePrefixes = [
  "/login",
  "/register",
  "/forgot-password",
  "/resend-verification",
  "/reset-password",
  "/verify-email",
  "/dashboard",
  "/admin"
];

export function resolveSeoMetadata(pathname: string): SeoMetadata {
  const normalizedPath =
    pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const project = projects.find((item) => normalizedPath === `/portfolio/${item.slug}`);
  if (project) {
    return {
      title: `${project.title} — ${site.name}`,
      description: project.description,
      indexable: true,
      type: "article"
    };
  }

  const service = services.find((item) => normalizedPath === `/services/${item.slug}`);
  if (service) {
    return {
      title: `${service.name} — ${site.name}`,
      description: service.description,
      indexable: true,
      type: "article"
    };
  }

  const publicPage = publicPages[normalizedPath];
  if (publicPage) {
    return { ...publicPage, indexable: true, type: "website" };
  }

  const isPrivate = privatePrefixes.some(
    (prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)
  );
  return {
    title: isPrivate ? `Account — ${site.name}` : `Page Not Found — ${site.name}`,
    description: isPrivate
      ? "Secure account access for Serhii Dev Studio clients."
      : "The requested page could not be found.",
    indexable: false,
    type: "website"
  };
}
