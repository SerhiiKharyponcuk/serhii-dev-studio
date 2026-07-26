import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router";
import { brand, site } from "../config/site";

const links = [
  ["Work", "/portfolio"],
  ["Services", "/services"],
  ["Pricing", "/pricing"],
  ["About", "/about"],
  ["Contact", "/contact"]
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[#070812]/75 backdrop-blur-xl">
      <div className="shell flex h-[72px] items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 font-bold tracking-[-.03em]"
          aria-label={`${site.name} home`}
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
        <nav className="desktop-only flex items-center gap-7" aria-label="Main navigation">
          {links.map(([label, href]) => (
            <NavLink
              key={href}
              className={({ isActive }) =>
                `text-sm transition ${isActive ? "text-white" : "text-[#a3a5b4] hover:text-white"}`
              }
              to={href}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="desktop-only flex gap-2">
          <Link className="button button-ghost" to="/login">
            Log in
          </Link>
          <Link className="button button-primary" to="/order">
            Start project
          </Link>
        </div>
        <button
          className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 md:hidden"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="Toggle navigation"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav className="shell grid gap-2 border-t border-white/8 py-4 md:hidden">
          {links.map(([label, href]) => (
            <Link
              key={href}
              className="rounded-xl px-3 py-3 text-[#c3c5d2]"
              to={href}
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
          <Link className="button button-primary mt-2" to="/order" onClick={() => setOpen(false)}>
            Start project
          </Link>
        </nav>
      )}
    </header>
  );
}
