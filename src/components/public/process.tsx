import * as React from "react";

export function ProcessSection() {
  const steps = [
    {
      number: "01",
      title: "Discover",
      description: "Understand your business, audience, goals and requirements.",
    },
    {
      number: "02",
      title: "Strategize",
      description: "Define creative direction, deliverables and project plan.",
    },
    {
      number: "03",
      title: "Create",
      description: "Develop content, campaigns, brand assets or your website.",
    },
    {
      number: "04",
      title: "Refine",
      description: "Review the work and make agreed improvements.",
    },
  ];

  return (
    <section id="process" className="px-6 py-20 sm:px-10 lg:px-16 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14">
          <p className="text-xs font-bold tracking-widest text-[#185fa5] uppercase">
            HOW WE WORK
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#142f4c] sm:text-4xl lg:text-5xl">
            From idea to <span className="gradient-text">impact.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((st) => (
            <article key={st.number} className="border-t-2 border-[#a8c4e0] pt-6">
              <span className="text-xl font-black text-[#1769b2]">
                {st.number}
              </span>
              <h3 className="mt-3 text-lg font-bold text-[#142f4c]">
                {st.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#52677e]">
                {st.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
