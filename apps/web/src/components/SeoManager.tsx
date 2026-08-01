import { useEffect } from "react";
import { useLocation } from "react-router";
import { resolveSeoMetadata } from "../config/seo";
import { useI18n } from "../i18n/I18nProvider";
import { locales } from "../i18n/translations";

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

function upsertAlternate(hreflang: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(
    `link[rel="alternate"][hreflang="${hreflang}"]`
  );
  if (!element) {
    element = document.createElement("link");
    element.rel = "alternate";
    element.hreflang = hreflang;
    document.head.append(element);
  }
  element.href = href;
}

export function SeoManager() {
  const { pathname } = useLocation();
  const { locale, t } = useI18n();
  useEffect(() => {
    const metadata = resolveSeoMetadata(pathname);
    const configuredOrigin = import.meta.env.VITE_SITE_URL?.trim();
    const origin = configuredOrigin || window.location.origin;
    const defaultUrl = new URL(pathname, origin).href;
    const canonical = new URL(pathname, origin);
    if (locale !== "en") canonical.searchParams.set("lang", locale);
    const canonicalUrl = canonical.href;
    const socialImageUrl = new URL("/og.png", origin).href;

    const title = t(metadata.title);
    const description = t(metadata.description);
    document.title = title;
    upsert("description", description);
    upsert("robots", metadata.indexable ? "index, follow" : "noindex, nofollow");
    upsert("og:title", title, true);
    upsert("og:description", description, true);
    upsert("og:url", canonicalUrl, true);
    upsert("og:type", metadata.type, true);
    upsert("og:image", socialImageUrl, true);
    upsert(
      "og:locale",
      {
        en: "en_US",
        uk: "uk_UA",
        de: "de_DE",
        nl: "nl_NL",
        ru: "ru_RU",
        es: "es_ES",
        fr: "fr_FR",
        pl: "pl_PL",
        it: "it_IT",
        pt: "pt_PT"
      }[locale],
      true
    );
    upsert("twitter:card", "summary_large_image");
    upsert("twitter:title", title);
    upsert("twitter:description", description);
    upsert("twitter:image", socialImageUrl);
    upsertLink("canonical", canonicalUrl);
    locales.forEach((item) => {
      const url = new URL(pathname, origin);
      if (item !== "en") url.searchParams.set("lang", item);
      upsertAlternate(item, url.href);
    });
    upsertAlternate("x-default", defaultUrl);
  }, [locale, pathname, t]);
  return null;
}
