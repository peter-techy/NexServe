import * as React from "react";

export function PortfolioSection() {
  return (
    <section id="portfolio" className="border-y border-[#225789]/20 bg-[#f0f6fc] px-6 py-20 sm:px-10 lg:px-16 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold tracking-widest text-[#185fa5] uppercase">
              CREATIVE DIRECTION
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#142f4c] sm:text-4xl lg:text-5xl">
              Ideas worth <span className="gradient-text">bringing to life.</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[#52677e]">
            Illustrative concepts showing the kinds of projects NexServe can create.
          </p>
        </div>

        {/* 3 Project Cards */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1 */}
          <article className="overflow-hidden rounded-2xl border border-[#225789]/20 bg-white p-4 pt-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
            <small className="block text-[10px] font-bold tracking-wider text-[#52677e] uppercase">
              01 / BRAND IDENTITY
            </small>
            <div className="my-3 flex min-h-[220px] flex-col justify-center rounded-xl bg-gradient-to-br from-[#bdd8f1] via-[#e2effa] to-[#f6faff] p-6 text-[#142f4c]">
              <span className="text-4xl font-black">
                N<span className="text-[#1769b2]">x</span>
              </span>
              <h3 className="mt-3 text-2xl font-black leading-tight text-[#142f4c]">
                Make Your Mark.
              </h3>
              <p className="mt-1 text-xs text-[#334f6d]">
                Distinctive visual identities.
              </p>
            </div>
            <strong className="block text-sm font-bold text-[#142f4c] pt-1 pb-1">
              Branding & Identity
            </strong>
          </article>

          {/* Card 2 */}
          <article className="overflow-hidden rounded-2xl border border-[#225789]/20 bg-white p-4 pt-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
            <small className="block text-[10px] font-bold tracking-wider text-[#52677e] uppercase">
              02 / CONTENT CREATION
            </small>
            <div className="my-3 flex min-h-[220px] flex-col justify-center rounded-xl bg-gradient-to-br from-[#a9c9e9] via-[#dceafb] to-[#f4f8fd] p-6 text-[#142f4c]">
              <small className="text-[9px] font-bold tracking-wider text-[#334f6d] uppercase">
                YOUR NEXT BIG IDEA
              </small>
              <h3 className="mt-2 text-2xl font-black leading-tight text-[#142f4c]">
                Scroll.
                <br />
                Stop.
                <br />
                Remember.
              </h3>
            </div>
            <strong className="block text-sm font-bold text-[#142f4c] pt-1 pb-1">
              Social Media Content
            </strong>
          </article>

          {/* Card 3 */}
          <article className="overflow-hidden rounded-2xl border border-[#225789]/20 bg-white p-4 pt-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
            <small className="block text-[10px] font-bold tracking-wider text-[#52677e] uppercase">
              03 / DIGITAL EXPERIENCE
            </small>
            <div className="my-3 flex min-h-[220px] flex-col justify-center rounded-xl bg-gradient-to-br from-[#9fc5e7] via-[#d9eafa] to-[#f5f9fe] p-6 text-[#142f4c]">
              <small className="text-[9px] font-bold tracking-wider text-[#334f6d] uppercase">
                THE FUTURE IS CREATIVE
              </small>
              <h3 className="mt-2 text-2xl font-black leading-tight text-[#142f4c]">
                Think
                <br />
                Beyond.
              </h3>
            </div>
            <strong className="block text-sm font-bold text-[#142f4c] pt-1 pb-1">
              Website & Digital Presence
            </strong>
          </article>
        </div>

        <p className="mt-6 text-xs text-[#52677e]">
          These are illustrative concepts, not claims of completed client projects.
        </p>
      </div>
    </section>
  );
}
