import { Mail } from "lucide-react";
import { Link } from "react-router";
import { site } from "../config/site";

export function Footer() {
  return (
    <footer className="border-t border-white/8 py-12">
      <div className="shell grid gap-9 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="text-lg font-bold">{site.name}</div>
          <p className="muted mt-3 max-w-sm text-sm">{site.description}</p>
        </div>
        <div className="grid content-start gap-2 text-sm">
          <b className="mb-2">Explore</b>
          <Link to="/portfolio">Portfolio</Link>
          <Link to="/services">Services</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/faq">FAQ</Link>
        </div>
        <div className="grid content-start gap-2 text-sm">
          <b className="mb-2">Contact</b>
          {site.email ? (
            <a className="flex items-center gap-2" href={`mailto:${site.email}`}>
              <Mail size={15} />
              {site.email}
            </a>
          ) : (
            <span className="muted">Contact details available through the project brief.</span>
          )}
        </div>
      </div>
      <div className="shell mt-10 flex flex-wrap justify-between gap-4 border-t border-white/8 pt-6 text-xs text-[#77798b]">
        <span>
          © {new Date().getFullYear()} {site.name}. All rights reserved.
        </span>
        <span className="flex gap-4">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/cookies">Cookies</Link>
        </span>
      </div>
    </footer>
  );
}
