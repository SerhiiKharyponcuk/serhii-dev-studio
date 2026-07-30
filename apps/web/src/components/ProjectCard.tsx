import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";
import type { projects } from "../config/site";

export function ProjectCard({ project }: { project: (typeof projects)[number] }) {
  const colors: Record<string, [string, string]> = {
    "waves-arcade": ["#3b82f6", "#22d3ee"],
    "metro-shop": ["#8b5cf6", "#e879f9"],
    "developer-portfolio": ["#6366f1", "#60a5fa"],
    "ip-information-website": ["#10b981", "#22d3ee"]
  };
  const pair = colors[project.slug] ?? ["#6366f1", "#a855f7"];
  return (
    <Link
      className="glass card interactive-card group block"
      to={`/portfolio/${project.slug}`}
      aria-label={`View ${project.title} case study`}
    >
      <div
        className="project-art"
        style={{ "--a": pair[0], "--b": pair[1] } as React.CSSProperties}
      >
        <span className="absolute left-4 top-4 z-10 pill">{project.category}</span>
      </div>
      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold">{project.title}</h3>
          <p className="muted mt-2 text-sm leading-6">{project.description}</p>
        </div>
        <span
          className="grid h-10 min-w-10 place-items-center rounded-full border border-white/10 transition group-hover:bg-white group-hover:text-black"
          aria-hidden="true"
        >
          <ArrowUpRight size={18} />
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {project.technologies.slice(0, 4).map((t) => (
          <span key={t} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-[#aeb0c0]">
            {t}
          </span>
        ))}
      </div>
    </Link>
  );
}
