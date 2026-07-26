import { useState } from "react";
import { ProjectCard } from "../../components/ProjectCard";
import { projects } from "../../config/site";

export function PortfolioGrid() {
  const categories = ["All", ...new Set(projects.map((project) => project.category))];
  const [selected, setSelected] = useState("All");
  const visible =
    selected === "All" ? projects : projects.filter((project) => project.category === selected);
  return (
    <div className="shell mt-12">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Portfolio filters">
        {categories.map((category) => (
          <button
            key={category}
            className={`button ${selected === category ? "button-primary" : "button-ghost"}`}
            aria-pressed={selected === category}
            onClick={() => setSelected(category)}
          >
            {category}
          </button>
        ))}
      </div>
      <div className="mt-7 grid gap-5 md:grid-cols-2">
        {visible.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </div>
  );
}
