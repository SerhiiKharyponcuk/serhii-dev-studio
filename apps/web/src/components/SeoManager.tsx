import { useEffect } from "react";
import { useLocation } from "react-router";
import { projects, services, site } from "../config/site";

function upsert(name: string, value: string, property = false) {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(property ? "property" : "name", name);
    document.head.append(element);
  }
  element.content = value;
}
export function SeoManager() {
  const { pathname } = useLocation();
  useEffect(() => {
    const project = projects.find((item) => pathname === `/portfolio/${item.slug}`);
    const service = services.find((item) => pathname === `/services/${item.slug}`);
    const title = project
      ? `${project.title} — ${site.name}`
      : service
        ? `${service.name} — ${site.name}`
        : pathname === "/"
          ? `${site.name} — ${site.title}`
          : `${pathname.split("/").filter(Boolean).at(-1)?.replaceAll("-", " ") ?? "Page"} — ${site.name}`;
    const description = project?.description ?? service?.description ?? site.description;
    document.title = title;
    upsert("description", description);
    upsert("og:title", title, true);
    upsert("og:description", description, true);
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.append(canonical);
    }
    canonical.href = new URL(pathname, window.location.origin).href;
  }, [pathname]);
  return null;
}
