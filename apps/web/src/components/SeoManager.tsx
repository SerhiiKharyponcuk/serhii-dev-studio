import { useEffect } from "react";
import { useLocation } from "react-router";
import { resolveSeoMetadata } from "../config/seo";

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

function upsertLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.rel = rel;
    document.head.append(element);
  }
  element.href = href;
}

export function SeoManager() {
  const { pathname } = useLocation();
  useEffect(() => {
    const metadata = resolveSeoMetadata(pathname);
    const configuredOrigin = import.meta.env.VITE_SITE_URL?.trim();
    const origin = configuredOrigin || window.location.origin;
    const canonicalUrl = new URL(pathname, origin).href;
    const socialImageUrl = new URL("/og.png", origin).href;

    document.title = metadata.title;
    upsert("description", metadata.description);
    upsert("robots", metadata.indexable ? "index, follow" : "noindex, nofollow");
    upsert("og:title", metadata.title, true);
    upsert("og:description", metadata.description, true);
    upsert("og:url", canonicalUrl, true);
    upsert("og:type", metadata.type, true);
    upsert("og:image", socialImageUrl, true);
    upsert("twitter:card", "summary_large_image");
    upsert("twitter:title", metadata.title);
    upsert("twitter:description", metadata.description);
    upsert("twitter:image", socialImageUrl);
    upsertLink("canonical", canonicalUrl);
  }, [pathname]);
  return null;
}
