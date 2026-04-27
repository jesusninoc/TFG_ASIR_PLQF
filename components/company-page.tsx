import type { ReactNode } from "react";

interface CompanyPageSection {
  title: string;
  body: ReactNode;
}

interface CompanyPageProps {
  eyebrow: string;
  title: string;
  intro: string;
  sections: CompanyPageSection[];
}

export function CompanyPage({ eyebrow, title, intro, sections }: CompanyPageProps) {
  return (
    <main className="bg-white">
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24 flex justify-center">
        <div className="max-w-4xl flex flex-col justify-center text-center items-center">
          <p className="mb-5 text-sm font-semibold text-[var(--accent)]">{eyebrow}</p>
          <h1 className="text-[clamp(3rem,8vw,6.5rem)] font-normal leading-none text-[var(--text-primary)]">
            {title}
          </h1>
          <p className="mt-8 max-w-3xl text-xl leading-8 text-[var(--text-secondary)] md:text-2xl md:leading-10">
            {intro}
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-20 sm:px-6 md:pb-28">
        <div className="grid gap-4">
          <div className="grid gap-4">
            {sections.map((section) => (
              <article key={section.title} className="mb-12">
                <h2 className="text-2xl font-semibold leading-8 text-[var(--text-primary)]">{section.title}</h2>
                <div className="mt-4 space-y-4 text-base leading-7 text-[var(--text-secondary)]">{section.body}</div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
