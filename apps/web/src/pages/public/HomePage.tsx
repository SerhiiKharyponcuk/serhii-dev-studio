import { motion } from "motion/react";
import { ArrowRight, ArrowUpRight, Code2, Layers3, Rocket, ShieldCheck } from "lucide-react";
import { Link } from "react-router";
import { ProjectCard } from "../../components/ProjectCard";
import { projects, services, site } from "../../config/site";

const process = ["Consultation", "Planning", "Development", "Testing", "Launch", "Support"];
export function HomePage() {
  return (
    <>
      <section className="section overflow-hidden pt-20">
        <div className="shell grid items-center gap-12 lg:grid-cols-[1.15fr_.85fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <span className="pill">
              <i className="status-dot" />
              Available for freelance projects
            </span>
            <p className="eyebrow mt-8">{site.developer}</p>
            <h1 className="title mt-4">
              Digital products that feel{" "}
              <span className="bg-gradient-to-r from-indigo-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">
                effortless.
              </span>
            </h1>
            <p className="muted mt-6 max-w-2xl text-lg leading-8">{site.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="button button-primary" to="/order">
                Start a project <ArrowRight size={17} />
              </Link>
              <Link className="button button-ghost" to="/portfolio">
                View portfolio
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#858798]">
              {site.technologies.slice(0, 6).map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </motion.div>
          <motion.div
            className="glass relative min-h-[430px] overflow-hidden rounded-[28px] p-5"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.65, delay: 0.1 }}
          >
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-600/30 blur-3xl" />
            <div className="relative rounded-2xl border border-white/10 bg-[#0a0d19]/90 p-5 font-mono text-sm shadow-2xl">
              <div className="mb-7 flex gap-2">
                <i className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <i className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <i className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="grid gap-3 text-[#abb0c6]">
                <p>
                  <span className="text-violet-300">const</span> studio ={" "}
                  <span className="text-blue-300">new</span> ProductPartner();
                </p>
                <p>
                  studio.<span className="text-cyan-300">discover</span>(yourGoals);
                </p>
                <p>
                  studio.<span className="text-cyan-300">design</span>({"{"} clarity: true {"}"});
                </p>
                <p>
                  studio.<span className="text-cyan-300">build</span>({"{"} scalable: true {"}"});
                </p>
                <p className="mt-3 text-emerald-300">✓ Ready to launch</p>
              </div>
            </div>
            <div className="glass absolute bottom-5 left-5 right-5 grid grid-cols-3 gap-3 rounded-2xl p-4 text-center">
              <div>
                <b className="text-xl">Fast</b>
                <p className="muted text-xs">Performance</p>
              </div>
              <div>
                <b className="text-xl">Secure</b>
                <p className="muted text-xs">Architecture</p>
              </div>
              <div>
                <b className="text-xl">Clear</b>
                <p className="muted text-xs">Communication</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      <section className="section">
        <div className="shell">
          <p className="eyebrow">Services</p>
          <div className="mt-3 flex items-end justify-between gap-6">
            <h2 className="section-title max-w-2xl">From first idea to reliable product.</h2>
            <Link className="muted text-sm" to="/services">
              All services →
            </Link>
          </div>
          <div className="grid-auto mt-10">
            {services.slice(0, 6).map((s, i) => {
              const Icon = [Code2, Layers3, Rocket, ShieldCheck][i % 4]!;
              return (
                <Link
                  key={s.slug}
                  className="glass card interactive-card group block"
                  to={`/services/${s.slug}`}
                >
                  <Icon className="text-indigo-300" />
                  <div className="mt-7 flex items-center justify-between gap-4">
                    <h3 className="text-lg font-bold">{s.name}</h3>
                    <ArrowUpRight
                      className="text-[#727587] transition group-hover:text-white"
                      size={18}
                    />
                  </div>
                  <p className="muted mt-2 text-sm leading-6">{s.description}</p>
                  <p className="mt-5 text-sm font-semibold">
                    Starting from ${s.price.toLocaleString()}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="shell">
          <p className="eyebrow">Selected work</p>
          <h2 className="section-title mt-3">Products built with purpose.</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {projects.map((p) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="shell">
          <p className="eyebrow">Process</p>
          <h2 className="section-title mt-3">A clear path from brief to launch.</h2>
          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {process.map((s, i) => (
              <div key={s} className="glass card flex items-center gap-4">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-500/20 text-sm text-indigo-200">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <b>{s}</b>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="shell glass overflow-hidden rounded-[28px] p-8 text-center md:p-16">
          <p className="eyebrow">Have a project in mind?</p>
          <h2 className="section-title mx-auto mt-4 max-w-3xl">
            Let’s turn it into a fast, thoughtful and scalable product.
          </h2>
          <p className="muted mx-auto mt-5 max-w-xl">
            Share your goals and receive a clear recommendation for scope, timeline and next steps.
          </p>
          <Link className="button button-primary mt-8" to="/order">
            Discuss your project <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </>
  );
}
