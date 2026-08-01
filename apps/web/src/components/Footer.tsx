import { Mail } from "lucide-react";
import { Link } from "react-router";
import { site } from "../config/site";
import { useI18n } from "../i18n/I18nProvider";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-white/8 py-12">
      <div className="shell grid gap-9 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="text-lg font-bold">{site.name}</div>
          <p className="muted mt-3 max-w-sm text-sm">{t(site.description)}</p>
        </div>
        <div className="grid content-start gap-2 text-sm">
          <b className="mb-2">{t("Explore")}</b>
          <Link to="/portfolio">{t("Portfolio")}</Link>
          <Link to="/services">{t("Services")}</Link>
          <Link to="/pricing">{t("Pricing")}</Link>
          <Link to="/faq">FAQ</Link>
        </div>
        <div className="grid content-start gap-2 text-sm">
          <b className="mb-2">{t("Contact")}</b>
          {site.email ? (
            <a className="flex items-center gap-2" href={`mailto:${site.email}`}>
              <Mail size={15} />
              {site.email}
            </a>
          ) : (
            <span className="muted">
              {t("Contact details available through the project brief.")}
            </span>
          )}
        </div>
      </div>
      <div className="shell mt-10 flex flex-wrap justify-between gap-4 border-t border-white/8 pt-6 text-xs text-[#77798b]">
        <span>
          © {new Date().getFullYear()} {site.name}. {t("All rights reserved.")}
        </span>
        <span className="flex gap-4">
          <Link to="/privacy">{t("Privacy")}</Link>
          <Link to="/terms">{t("Terms")}</Link>
          <Link to="/cookies">{t("Cookies")}</Link>
        </span>
      </div>
    </footer>
  );
}
