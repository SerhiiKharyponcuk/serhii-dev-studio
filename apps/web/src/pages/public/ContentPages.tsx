import { Check, ChevronDown } from "lucide-react";
import { Link, useParams } from "react-router";
import { pricing, projects, services, site } from "../../config/site";
import { ContactForm } from "../../features/contact/ContactForm";
import { PortfolioGrid } from "../../features/portfolio/PortfolioGrid";
import { useI18n } from "../../i18n/I18nProvider";

function Intro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  const { t } = useI18n();
  return (
    <div className="shell pt-20 text-center">
      <p className="eyebrow">{t(eyebrow)}</p>
      <h1 className="section-title mx-auto mt-4 max-w-4xl">{t(title)}</h1>
      <p className="muted mx-auto mt-5 max-w-2xl leading-7">{t(text)}</p>
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
  const { t } = useI18n();
  const { slug } = useParams();
  const p = projects.find((x) => x.slug === slug);
  if (!p) return <NotFound />;
  return (
    <section className="section">
      <div className="shell">
        <Link className="muted text-sm" to="/portfolio">
          ← {t("Back to portfolio")}
        </Link>
        <p className="eyebrow mt-10">{p.category}</p>
        <h1 className="title mt-4">{p.title}</h1>
        <p className="muted mt-6 max-w-3xl text-lg leading-8">{t(p.description)}</p>
        <div className="project-art mt-12 min-h-[440px]" />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <article className="glass card">
            <b>{t("Challenge")}</b>
            <p className="muted mt-3 text-sm leading-6">
              Create an experience that remains intuitive as the product and its feature set grow.
            </p>
          </article>
          <article className="glass card">
            <b>{t("Solution")}</b>
            <p className="muted mt-3 text-sm leading-6">
              A component-led interface backed by typed APIs and a scalable data model.
            </p>
          </article>
          <article className="glass card">
            <b>{t("Result")}</b>
            <p className="muted mt-3 text-sm leading-6">
              A responsive foundation ready for measured iteration and production deployment.
            </p>
          </article>
        </div>
        <h2 className="mt-14 text-2xl font-bold">{t("Technology")}</h2>
        <div className="mt-5 flex flex-wrap gap-2">
          {p.technologies.map((t) => (
            <span className="pill" key={t}>
              {t}
            </span>
          ))}
        </div>
        <p className="muted mt-8 text-sm">
          {t("Live demo and source links are shown only when verified URLs are configured.")}
        </p>
      </div>
    </section>
  );
}
export function ServicesPage() {
  const { t } = useI18n();
  return (
    <section className="section pt-0">
      <Intro
        eyebrow="Services"
        title="Flexible development services, built around outcomes."
        text="Choose a starting point. Scope, milestones and final investment are confirmed after discovery."
      />
      <div className="shell grid-auto mt-12">
        {services.map((s) => (
          <article key={s.slug} className="glass card interactive-card flex flex-col">
            <p className="text-xs text-indigo-300">{s.time}</p>
            <h2 className="mt-3 text-xl font-bold">{t(s.name)}</h2>
            <p className="muted mt-3 text-sm leading-6">{t(s.description)}</p>
            <ul className="mt-5 grid gap-2 text-sm">
              {s.features.map((f) => (
                <li className="flex gap-2" key={f}>
                  <Check size={16} className="text-emerald-300" />
                  {t(f)}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-7">
              <b>
                {t("Starting from")} ${s.price.toLocaleString()}
              </b>
              <Link className="button button-ghost mt-4 w-full" to={`/services/${s.slug}`}>
                {t("View service")}
              </Link>
            </div>
          </article>
        ))}
      </div>
      <p className="shell muted mt-8 text-center text-sm">
        {t("Final price depends on project complexity, design, features and deadline.")}
      </p>
    </section>
  );
}
export function ServicePage() {
  const { t } = useI18n();
  const { slug } = useParams();
  const s = services.find((x) => x.slug === slug);
  if (!s) return <NotFound />;
  return (
    <section className="section">
      <div className="shell max-w-4xl">
        <Link className="muted text-sm" to="/services">
          ← {t("All services")}
        </Link>
        <p className="eyebrow mt-10">{s.time}</p>
        <h1 className="title mt-4">{t(s.name)}</h1>
        <p className="muted mt-6 text-lg leading-8">{t(s.description)}</p>
        <div className="glass card mt-10">
          <h2 className="text-xl font-bold">{t("What’s included")}</h2>
          <ul className="mt-5 grid gap-3">
            {s.features.map((f) => (
              <li className="flex gap-3" key={f}>
                <Check className="text-emerald-300" />
                {t(f)}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-xl font-bold">
            {t("Starting from")} ${s.price.toLocaleString()}
          </p>
          <p className="muted mt-2 text-sm">
            {t("Final price depends on project complexity, design, features and deadline.")}
          </p>
          <Link className="button button-primary mt-7" to={`/order?service=${s.slug}`}>
            {t("Order this service")}
          </Link>
        </div>
      </div>
    </section>
  );
}
export function PricingPage() {
  const { t } = useI18n();
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
            className={`glass card interactive-card relative ${
              p.popular ? "ring-1 ring-indigo-400" : ""
            }`}
            key={p.name}
          >
            {p.popular && <span className="pill absolute right-4 top-4">{t("Most popular")}</span>}
            <h2 className="text-xl font-bold">{t(p.name)}</h2>
            <p className="muted mt-3 min-h-16 text-sm leading-6">{t(p.description)}</p>
            <p className="mt-7 text-3xl font-bold">
              {t("From")} {p.price}
            </p>
            <ul className="my-7 grid gap-3 text-sm">
              {p.features.map((f) => (
                <li className="flex gap-2" key={f}>
                  <Check size={17} className="text-emerald-300" />
                  {t(f)}
                </li>
              ))}
            </ul>
            <Link
              className={`button w-full ${p.popular ? "button-primary" : "button-ghost"}`}
              to="/order"
            >
              {t("Start project")}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
export function AboutPage() {
  const { t } = useI18n();
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
          <h2 className="text-2xl font-bold">{t("A practical, transparent approach")}</h2>
          <p className="muted mt-5 leading-7">
            {t(
              "Clear scope, visible progress and thoughtful trade-offs are part of the work—not extras. I design systems that are easy to understand today and ready to evolve tomorrow."
            )}
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            {site.technologies.map((t) => (
              <span className="pill" key={t}>
                {t}
              </span>
            ))}
          </div>
          <Link className="button button-primary mt-8" to="/order">
            {t("Start a project")}
          </Link>
        </div>
      </div>
      <div className="shell mt-12">
        <h2 className="text-2xl font-bold">{t("Certificates")}</h2>
        <div className="glass card muted mt-5 text-sm">
          {t(
            "Verified certificates will appear here when their title, issuer, date, image and verification link are configured."
          )}
        </div>
      </div>
    </section>
  );
}
export function ContactPage() {
  const { t } = useI18n();
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
          {t("Project brief")}
        </Link>
      </div>
    </section>
  );
}

const faqs = [
  {
    question: "How does a project start?",
    answer:
      "Send a project brief with your goals, required features, budget range and preferred timing. After a short discovery phase, you receive a written scope, estimate and milestone plan."
  },
  {
    question: "Are the prices fixed?",
    answer:
      "The prices shown on this website are starting points. The final price is confirmed in writing after the scope, integrations, content, design and deadline are understood."
  },
  {
    question: "How are payments structured?",
    answer:
      "Payment schedules are agreed per project and usually follow clearly defined milestones. Work outside the agreed scope is estimated separately before it begins."
  },
  {
    question: "Will I own the finished product?",
    answer:
      "Ownership and licence terms are stated in the project agreement. Custom deliverables are normally transferred after full payment, while third-party libraries remain under their own licences."
  },
  {
    question: "Can you maintain the product after launch?",
    answer:
      "Yes. Maintenance can cover security updates, monitoring, backups, small improvements and priority support under a separate ongoing plan."
  },
  {
    question: "Can you work with an existing codebase?",
    answer:
      "Yes. Existing projects begin with a technical review so risks, constraints and the safest path forward are visible before changes are made."
  },
  {
    question: "What do I need to provide?",
    answer:
      "You provide timely feedback, approved content, brand assets and access to services required by the project. Missing inputs can affect the agreed delivery dates."
  }
];

const legalContent: Record<
  string,
  { title: string; intro: string; sections: { title: string; paragraphs: string[] }[] }
> = {
  Privacy: {
    title: "Privacy Policy",
    intro:
      "This policy explains how Serhii Dev Studio handles personal data when you browse the website, submit an enquiry, create an account or work on a project.",
    sections: [
      {
        title: "Who is responsible",
        paragraphs: [
          `Serhii Dev Studio is operated by ${site.developer} in the Netherlands. It acts as the data controller for the processing described here. Privacy requests can be submitted through the contact form.`
        ]
      },
      {
        title: "Data we collect",
        paragraphs: [
          "We may collect identity and contact details, project requirements, account and authentication records, messages, uploaded files, payment and invoice records, support requests, and limited technical or security logs.",
          "Please do not submit sensitive personal data or confidential third-party information unless it is necessary and explicitly agreed."
        ]
      },
      {
        title: "Why we use it",
        paragraphs: [
          "Data is used to respond to enquiries, take steps before entering a contract, deliver and support agreed services, secure accounts, prevent abuse, maintain business records and comply with legal obligations.",
          "The legal basis may be performance of a contract, steps requested before a contract, a legal obligation, or a legitimate interest such as service security and business administration. Consent is used where the law requires it."
        ]
      },
      {
        title: "Sharing and international transfers",
        paragraphs: [
          "Data is shared only with service providers needed to operate the platform, such as hosting, database, object storage, transactional email and error-monitoring providers, or with professional advisers and authorities when required by law.",
          "Some providers may process data outside the European Economic Area. Where applicable, an adequacy decision, standard contractual clauses or another lawful safeguard will be used."
        ]
      },
      {
        title: "Retention and security",
        paragraphs: [
          "Enquiries that do not become projects are normally reviewed for deletion within 24 months. Project, invoice and payment records may be retained for the engagement and any period required by tax, accounting or legal obligations. Account data, messages and files are removed or anonymised when no longer needed for the service or a legal claim.",
          "Technical and organisational safeguards include access controls, hashed passwords, short-lived authentication tokens, encrypted transport, private storage and activity logging. No online system can guarantee absolute security."
        ]
      },
      {
        title: "Your rights",
        paragraphs: [
          "Depending on the circumstances, you may request access, correction, erasure, restriction, portability or object to processing. You may withdraw consent without affecting earlier lawful processing.",
          "You also have the right to complain to the Dutch Data Protection Authority or the supervisory authority in your country. We may need to verify your identity before completing a request."
        ]
      }
    ]
  },
  Terms: {
    title: "Terms of Service",
    intro:
      "These website terms apply to enquiries and use of the Serhii Dev Studio client platform. A separate written proposal or project agreement takes priority for paid work.",
    sections: [
      {
        title: "Enquiries and proposals",
        paragraphs: [
          "Website prices and timelines are indicative starting points, not binding offers. A project begins only after both parties accept the scope, deliverables, price, schedule and payment terms in writing."
        ]
      },
      {
        title: "Client responsibilities",
        paragraphs: [
          "You must provide accurate information, timely feedback, lawful content and the permissions needed for any materials, accounts or third-party services supplied for the project. Delays in these inputs may change delivery dates."
        ]
      },
      {
        title: "Payments and changes",
        paragraphs: [
          "Invoices, deposits, milestones, taxes and late-payment terms are defined in the project agreement. Work outside the agreed scope requires written approval and may affect the price and schedule."
        ]
      },
      {
        title: "Intellectual property",
        paragraphs: [
          "Ownership and licences are defined per project. Unless agreed otherwise, transfer of custom deliverables occurs after full payment. Pre-existing tools, reusable components, open-source software and third-party assets remain subject to their existing ownership and licence terms."
        ]
      },
      {
        title: "Acceptable use and accounts",
        paragraphs: [
          "You are responsible for keeping account credentials secure. You may not misuse the platform, attempt unauthorised access, upload unlawful or malicious material, interfere with the service, or use it to violate another person’s rights."
        ]
      },
      {
        title: "Availability and liability",
        paragraphs: [
          "Reasonable care is used to provide a secure and reliable service, but uninterrupted availability cannot be guaranteed. Any warranties, liability limits, acceptance process and remedies for paid work are governed by the applicable project agreement and mandatory law."
        ]
      },
      {
        title: "Law, changes and contact",
        paragraphs: [
          "These website terms are governed by the laws of the Netherlands, without limiting mandatory consumer protections that may apply. Material updates will be published on this page. Questions can be submitted through the contact form."
        ]
      }
    ]
  },
  Cookies: {
    title: "Cookie Policy",
    intro:
      "This website currently uses only cookies that are necessary for secure account sessions. Optional analytics or advertising cookies are not activated.",
    sections: [
      {
        title: "What cookies are",
        paragraphs: [
          "Cookies are small text records stored by a website in your browser. Session cookies are removed automatically after a session, while persistent cookies remain until their expiry or deletion."
        ]
      },
      {
        title: "Essential session cookies",
        paragraphs: [
          "The access_token cookie keeps an authenticated session active for a short period. The refresh_token cookie is restricted to the authentication endpoint and supports secure session renewal. Both are first-party, HttpOnly and Secure in production, and are protected with an appropriate SameSite setting.",
          "These cookies are required to provide the account area and protect it from unauthorised access. They are not used for advertising or cross-site tracking."
        ]
      },
      {
        title: "Optional cookies",
        paragraphs: [
          "If analytics, personalisation or advertising tools are added later, they will remain disabled until you make a clear choice where consent is legally required. Refusing optional cookies will not block normal use of the website."
        ]
      },
      {
        title: "Managing cookies",
        paragraphs: [
          "You can remove or block cookies in your browser settings. Blocking essential cookies will prevent sign-in and other secure account features from working. Questions can be submitted through the contact form."
        ]
      }
    ]
  }
};

function LegalPage({ kind }: { kind: string }) {
  const { locale, t } = useI18n();
  const content = legalContent[kind];
  if (!content) return null;
  return (
    <section className="section pt-0">
      <Intro eyebrow={kind} title={content.title} text={content.intro} />
      <article className="shell mt-12 max-w-4xl">
        {locale !== "en" && (
          <p className="mb-5 rounded-xl border border-amber-300/20 bg-amber-300/8 px-4 py-3 text-sm text-amber-100">
            {t("Legal documents are currently available in English only.")}
          </p>
        )}
        <p className="muted text-sm">{t("Effective 30 July 2026")}</p>
        <div className="mt-8 grid gap-4">
          {content.sections.map((section) => (
            <section className="glass card" key={section.title}>
              <h2 className="text-xl font-bold">{t(section.title)}</h2>
              <div className="muted mt-4 grid gap-3 leading-7">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{t(paragraph)}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>
    </section>
  );
}

export function SimplePage({ kind }: { kind: string }) {
  const { t } = useI18n();
  if (legalContent[kind]) return <LegalPage kind={kind} />;
  if (kind === "FAQ")
    return (
      <section className="section pt-0">
        <Intro
          eyebrow="FAQ"
          title="Frequently asked questions"
          text="Practical answers about scope, pricing, delivery, ownership and support."
        />
        <div className="shell mt-12 grid max-w-4xl gap-3">
          {faqs.map((item) => (
            <details
              className="glass card group transition open:border-indigo-400/30"
              key={item.question}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-lg font-bold">
                <span>{t(item.question)}</span>
                <ChevronDown
                  className="min-w-5 text-[#77798c] transition group-open:rotate-180 group-open:text-indigo-300"
                  size={20}
                  aria-hidden="true"
                />
              </summary>
              <p className="muted mt-4 leading-7">{t(item.answer)}</p>
            </details>
          ))}
        </div>
      </section>
    );
  return (
    <section className="section">
      <Intro eyebrow={kind} title="Page" text="Content unavailable." />
    </section>
  );
}
export function NotFound() {
  const { t } = useI18n();
  return (
    <section className="section text-center">
      <div className="shell">
        <p className="eyebrow">404</p>
        <h1 className="section-title mt-4">{t("This page has moved beyond the map.")}</h1>
        <Link className="button button-primary mt-8" to="/">
          {t("Return home")}
        </Link>
      </div>
    </section>
  );
}
