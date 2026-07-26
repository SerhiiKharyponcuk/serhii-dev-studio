import { Check } from "lucide-react";
import { Link, useParams } from "react-router";
import { pricing, projects, services, site } from "../../config/site";
import { ContactForm } from "../../features/contact/ContactForm";
import { PortfolioGrid } from "../../features/portfolio/PortfolioGrid";

function Intro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="shell pt-20 text-center">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="section-title mx-auto mt-4 max-w-4xl">{title}</h1>
      <p className="muted mx-auto mt-5 max-w-2xl leading-7">{text}</p>
    </div>
  );
}
export function PortfolioPage() {
  return (
    <section className="section pt-0">
      <Intro
        eyebrow="Portfolio"
        title="Selected products, interfaces and experiments."
        text="A focused collection of work across web applications, commerce and personal brands."
      />
      <PortfolioGrid />
    </section>
  );
}
export function ProjectPage() {
  const { slug } = useParams();
  const p = projects.find((x) => x.slug === slug);
  if (!p) return <NotFound />;
  return (
    <section className="section">
      <div className="shell">
        <Link className="muted text-sm" to="/portfolio">
          ← Back to portfolio
        </Link>
        <p className="eyebrow mt-10">{p.category}</p>
        <h1 className="title mt-4">{p.title}</h1>
        <p className="muted mt-6 max-w-3xl text-lg leading-8">{p.description}</p>
        <div className="project-art mt-12 min-h-[440px]" />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <article className="glass card">
            <b>Challenge</b>
            <p className="muted mt-3 text-sm leading-6">
              Create an experience that remains intuitive as the product and its feature set grow.
            </p>
          </article>
          <article className="glass card">
            <b>Solution</b>
            <p className="muted mt-3 text-sm leading-6">
              A component-led interface backed by typed APIs and a scalable data model.
            </p>
          </article>
          <article className="glass card">
            <b>Result</b>
            <p className="muted mt-3 text-sm leading-6">
              A responsive foundation ready for measured iteration and production deployment.
            </p>
          </article>
        </div>
        <h2 className="mt-14 text-2xl font-bold">Technology</h2>
        <div className="mt-5 flex flex-wrap gap-2">
          {p.technologies.map((t) => (
            <span className="pill" key={t}>
              {t}
            </span>
          ))}
        </div>
        <p className="muted mt-8 text-sm">
          Live demo and source links are shown only when verified URLs are configured.
        </p>
      </div>
    </section>
  );
}
export function ServicesPage() {
  return (
    <section className="section pt-0">
      <Intro
        eyebrow="Services"
        title="Flexible development services, built around outcomes."
        text="Choose a starting point. Scope, milestones and final investment are confirmed after discovery."
      />
      <div className="shell grid-auto mt-12">
        {services.map((s) => (
          <article key={s.slug} className="glass card flex flex-col">
            <p className="text-xs text-indigo-300">{s.time}</p>
            <h2 className="mt-3 text-xl font-bold">{s.name}</h2>
            <p className="muted mt-3 text-sm leading-6">{s.description}</p>
            <ul className="mt-5 grid gap-2 text-sm">
              {s.features.map((f) => (
                <li className="flex gap-2" key={f}>
                  <Check size={16} className="text-emerald-300" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-7">
              <b>Starting from ${s.price.toLocaleString()}</b>
              <Link className="button button-ghost mt-4 w-full" to={`/services/${s.slug}`}>
                View service
              </Link>
            </div>
          </article>
        ))}
      </div>
      <p className="shell muted mt-8 text-center text-sm">
        Final price depends on project complexity, design, features and deadline.
      </p>
    </section>
  );
}
export function ServicePage() {
  const { slug } = useParams();
  const s = services.find((x) => x.slug === slug);
  if (!s) return <NotFound />;
  return (
    <section className="section">
      <div className="shell max-w-4xl">
        <Link className="muted text-sm" to="/services">
          ← All services
        </Link>
        <p className="eyebrow mt-10">{s.time}</p>
        <h1 className="title mt-4">{s.name}</h1>
        <p className="muted mt-6 text-lg leading-8">{s.description}</p>
        <div className="glass card mt-10">
          <h2 className="text-xl font-bold">What’s included</h2>
          <ul className="mt-5 grid gap-3">
            {s.features.map((f) => (
              <li className="flex gap-3" key={f}>
                <Check className="text-emerald-300" />
                {f}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-xl font-bold">Starting from ${s.price.toLocaleString()}</p>
          <p className="muted mt-2 text-sm">
            Final price depends on project complexity, design, features and deadline.
          </p>
          <Link className="button button-primary mt-7" to={`/order?service=${s.slug}`}>
            Order this service
          </Link>
        </div>
      </div>
    </section>
  );
}
export function PricingPage() {
  return (
    <section className="section pt-0">
      <Intro
        eyebrow="Pricing"
        title="A clear starting point for every stage."
        text="Every project is scoped individually. These plans help set expectations before our first conversation."
      />
      <div className="shell mt-12 grid gap-5 lg:grid-cols-3">
        {pricing.map((p) => (
          <article
            className={`glass card relative ${p.popular ? "ring-1 ring-indigo-400" : ""}`}
            key={p.name}
          >
            {p.popular && <span className="pill absolute right-4 top-4">Most popular</span>}
            <h2 className="text-xl font-bold">{p.name}</h2>
            <p className="muted mt-3 min-h-16 text-sm leading-6">{p.description}</p>
            <p className="mt-7 text-3xl font-bold">From {p.price}</p>
            <ul className="my-7 grid gap-3 text-sm">
              {p.features.map((f) => (
                <li className="flex gap-2" key={f}>
                  <Check size={17} className="text-emerald-300" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              className={`button w-full ${p.popular ? "button-primary" : "button-ghost"}`}
              to="/order"
            >
              Start project
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
export function AboutPage() {
  return (
    <section className="section pt-0">
      <Intro
        eyebrow="About"
        title={`Hi, I’m ${site.developer}. I build dependable digital products.`}
        text="I combine product thinking, interface craft and full-stack engineering to help businesses move from an idea to a maintainable solution."
      />
      <div className="shell mt-12 grid gap-5 md:grid-cols-2">
        <div className="glass card min-h-80 bg-gradient-to-br from-indigo-500/20 to-violet-500/5">
          <span className="pill">{site.location}</span>
          <div className="mt-20 text-6xl font-bold text-white/10">SK</div>
        </div>
        <div className="glass card">
          <h2 className="text-2xl font-bold">A practical, transparent approach</h2>
          <p className="muted mt-5 leading-7">
            Clear scope, visible progress and thoughtful trade-offs are part of the work—not extras.
            I design systems that are easy to understand today and ready to evolve tomorrow.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            {site.technologies.map((t) => (
              <span className="pill" key={t}>
                {t}
              </span>
            ))}
          </div>
          <Link className="button button-primary mt-8" to="/order">
            Start a project
          </Link>
        </div>
      </div>
      <div className="shell mt-12">
        <h2 className="text-2xl font-bold">Certificates</h2>
        <div className="glass card muted mt-5 text-sm">
          Verified certificates will appear here when their title, issuer, date, image and
          verification link are configured.
        </div>
      </div>
    </section>
  );
}
export function ContactPage() {
  return (
    <section className="section pt-0">
      <Intro
        eyebrow="Contact"
        title="Tell me what you want to build."
        text="For a structured estimate, use the project brief. For a quick question, send a message."
      />
      <ContactForm />
      <div className="shell mt-6 flex flex-wrap justify-center gap-3">
        {site.email && (
          <a className="button button-ghost" href={`mailto:${site.email}`}>
            {site.email}
          </a>
        )}
        <Link className="button button-primary" to="/order">
          Project brief
        </Link>
      </div>
    </section>
  );
}
export function SimplePage({ kind }: { kind: string }) {
  const copy: Record<string, [string, string]> = {
    Reviews: [
      "Client reviews",
      "Approved reviews from completed projects will appear here. No unverified testimonials are published."
    ],
    FAQ: [
      "Frequently asked questions",
      "Timelines depend on scope. Every engagement begins with discovery, a written estimate and clear milestones."
    ],
    Privacy: [
      "Privacy Policy",
      "This policy will describe data collection, account records, retention, processors and user rights before production launch."
    ],
    Terms: [
      "Terms of Service",
      "Final commercial terms, payment schedules, intellectual property and support conditions are agreed per project."
    ],
    Cookies: [
      "Cookie Policy",
      "Essential cookies support secure sessions. Optional analytics cookies will require consent before activation."
    ]
  };
  const x = copy[kind] ?? ["Page", "Content unavailable."];
  return (
    <section className="section">
      <Intro eyebrow={kind} title={x[0]} text={x[1]} />
    </section>
  );
}
export function NotFound() {
  return (
    <section className="section text-center">
      <div className="shell">
        <p className="eyebrow">404</p>
        <h1 className="section-title mt-4">This page has moved beyond the map.</h1>
        <Link className="button button-primary mt-8" to="/">
          Return home
        </Link>
      </div>
    </section>
  );
}
