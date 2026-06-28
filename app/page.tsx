import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PROJECTS } from "@/data/projects";
import { SKILLS } from "@/data/skills";
import MonoLabel from "@/components/mono-label";
import ProjectCard from "@/components/project-card";
import Reveal from "@/components/reveal";
import NameRoller from "@/components/name-roller";

export default function Home() {
  const featuredSlugs = ["graphic-designs", "colormesh", "the-deck-chair"];
  const featured = featuredSlugs
    .map((slug) => PROJECTS.find((p) => p.slug === slug))
    .filter(Boolean) as typeof PROJECTS;

  return (
    <>
      {/* Hero */}
      <section className="hero-h flex flex-col justify-center px-6 md:px-16 max-w-7xl mx-auto">
        <Reveal>
          <h1 className="font-display hero-title">
            <span style={{ display: "block" }}>I am <span className="name-gradient"><NameRoller /></span></span>
            <span style={{ display: "block" }}>
              a designer who builds{" "}
              <span className="text-accent">interfaces</span>
              {", "}
              <span className="text-accent">objects</span>
              {", and "}
              <span className="text-accent">stories</span>.
            </span>
          </h1>
        </Reveal>
        <Reveal delay={150}>
          <p className="font-body mt-4 md:mt-6 text-sm md:text-base" style={{ color: "var(--muted)" }}>
            Design Executive at Norline Studio · B.Des student at UPES, Dehradun.
          </p>
        </Reveal>
      </section>

      {/* Quick intro */}
      <section className="px-6 md:px-16 max-w-7xl mx-auto py-16 md:py-24">
        <Reveal>
          <p className="font-body intro-copy text-sm md:text-base" style={{ maxWidth: "640px" }}>
            I&apos;m an experience design student from Dehradun interested in how people
            think, feel, and interpret what they interact with. I like work that
            challenges patterns and pushes design beyond surface-level aesthetics —
            toward something that actually shapes how people experience the world
            around them.
          </p>
        </Reveal>
      </section>

      {/* Featured work */}
      <section className="px-6 md:px-16 max-w-7xl mx-auto py-8 md:py-12 hairline">
        <Reveal>
          <MonoLabel className="block mb-8 pt-10">Selected Work</MonoLabel>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 mb-8">
          {featured.map((p, i) => (
            <ProjectCard key={p.slug} project={p} index={i} />
          ))}
        </div>
        <Reveal>
          <Link href="/portfolio" className="text-link font-body inline-flex items-center gap-2 text-sm md:text-base">
            View all work <ArrowRight size={16} />
          </Link>
        </Reveal>
      </section>

      {/* Capabilities */}
      <section className="px-6 md:px-16 max-w-7xl mx-auto py-16 md:py-24 hairline">
        <Reveal>
          <MonoLabel className="block mb-8">What I Do</MonoLabel>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-x-10 md:gap-y-12">
          {SKILLS.map((s, i) => (
            <Reveal key={s.group} delay={i * 60}>
              <h4 className="font-body font-medium mb-2 text-sm md:text-base">{s.group}</h4>
              <p className="font-body text-xs md:text-sm" style={{ color: "var(--muted)" }}>
                {s.tools.join(", ")}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Current role */}
      <section className="px-6 md:px-16 max-w-7xl mx-auto py-14 md:py-20 hairline">
        <Reveal>
          <MonoLabel className="block mb-4">Currently</MonoLabel>
          <p className="font-display text-lg md:text-2xl mb-3">
            Design Executive, Norline Studio — since June 2026.
          </p>
          <p className="font-body text-sm md:text-base" style={{ color: "var(--muted)", maxWidth: "560px" }}>
            Currently focused on day-to-day visual and UI work across the studio&apos;s
            client projects.
          </p>
        </Reveal>
      </section>

      {/* CTA band */}
      <section className="cta-band">
        <div className="max-w-7xl mx-auto px-6 md:px-16 py-12 md:py-16 text-center">
          <Reveal>
            <p className="font-display text-xl md:text-3xl mb-6">Want the full picture?</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
              <Link
                href="/portfolio"
                className="text-link font-body inline-flex items-center gap-2 text-sm md:text-base"
              >
                See the Work <ArrowRight size={16} />
              </Link>
              <Link
                href="/resume"
                className="text-link font-body inline-flex items-center gap-2 text-sm md:text-base"
              >
                View Resume <ArrowRight size={16} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
