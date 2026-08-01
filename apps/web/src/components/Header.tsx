import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { brand, site } from "../config/site";
import { useI18n } from "../i18n/I18nProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";

const links = [
  ["Work", "/portfolio"],
  ["Services", "/services"],
  ["Pricing", "/pricing"],
  ["About", "/about"],
  ["Contact", "/contact"]
] as const;

export function Header() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[#070812]/75 backdrop-blur-xl">
      <div className="shell flex h-[72px] items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 font-bold tracking-[-.03em]"
          aria-label={`${site.name} ${t("home")}`}
        >
          <span
            className="grid h-8 w-8 place-items-center rounded-lg text-sm"
            style={{
              background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.accentColor})`
            }}
          >
            {brand.logoMark}
          </span>
          {site.name}
        </Link>
        <nav className="desktop-only flex items-center gap-5" aria-label={t("Main navigation")}>
          {links.map(([label, href]) => (
            <NavLink
              key={href}
              className={({ isActive }) =>
                `text-sm transition-colors duration-200 ${
                  isActive ? "text-white" : "text-[#a3a5b4] hover:text-white"
                }`
              }
              to={href}
            >
              {t(label)}
            </NavLink>
          ))}
        </nav>
        <div className="desktop-only flex items-center gap-2">
          <LanguageSwitcher />
          <Link className="button button-ghost" to="/login">
            {t("Log in")}
          </Link>
          <Link className="button button-primary" to="/order">
            {t("Start project")}
          </Link>
        </div>
        <button
          className="icon-button header-menu-button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={t(open ? "Close navigation" : "Open navigation")}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav
          id="mobile-navigation"
          className="header-mobile-navigation shell grid gap-1 border-t border-white/8 py-4"
          aria-label={t("Mobile navigation")}
        >
          {links.map(([label, href]) => (
            <NavLink
              key={href}
              className={({ isActive }) =>
                `rounded-xl px-3 py-3 transition-colors duration-200 ${
                  isActive ? "bg-white/8 text-white" : "text-[#c3c5d2] hover:bg-white/5"
                }`
              }
              to={href}
              onClick={() => setOpen(false)}
            >
              {t(label)}
            </NavLink>
          ))}
          <div className="mt-2 border-t border-white/8 pt-4">
            <LanguageSwitcher compact />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link className="button button-ghost" to="/login" onClick={() => setOpen(false)}>
              {t("Log in")}
            </Link>
            <Link className="button button-primary" to="/order" onClick={() => setOpen(false)}>
              {t("Start project")}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
