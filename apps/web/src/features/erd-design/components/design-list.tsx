"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, ArrowUpRight, Plus } from "lucide-react";
import { Button, Spinner } from "@/components/ui";
import { CrowsFoot, CardinalityGlyph } from "@/components/crows-foot";
import { useDesigns } from "../api/use-designs";

const NEW_DESIGN_LINK =
  "inline-flex items-center gap-[7px] font-semibold text-sm rounded-[2px] px-[15px] py-[9px] border-[1.5px] border-ink bg-clay text-paper shadow-brutal transition-[transform,box-shadow,background] duration-150 cursor-pointer motion-reduce:transition-none hover:-translate-x-px hover:-translate-y-px hover:shadow-brutal-lg active:translate-x-px active:translate-y-px active:shadow-brutal-sm focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(177_116_87/0.3)]";

export function DesignList() {
  const { data, isPending, error, refetch } = useDesigns();
  const [mounted, setMounted] = useState(false);
  const designs = data ?? [];

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <main className="min-h-screen bg-paper text-ink font-sans antialiased [text-rendering:optimizeLegibility] bg-[radial-gradient(rgb(74_73_71/0.08)_1px,transparent_1.4px)] [background-size:24px_24px] [background-position:-1px_-1px]">
      <div className="mx-auto max-w-[1120px] px-[30px] pt-[34px] pb-[90px]">
        <header
          className={
            "flex items-center justify-between gap-4 pb-[26px] max-[560px]:flex-wrap " +
            (mounted ? "animate-fade motion-reduce:animate-none" : "opacity-0")
          }
        >
          <div className="flex items-center gap-[11px]">
            <span
              className="grid place-items-center w-10 h-10 text-paper bg-clay border-[1.5px] border-ink rounded-[3px] shadow-brutal"
              aria-hidden="true"
            >
              <CrowsFoot size={26} strokeWidth={1.9} />
            </span>
            <span className="font-extrabold text-[23px] tracking-[0.14em] text-ink">
              CARDINAL
            </span>
            <span className="font-mono text-[11px] text-ink/55 pl-3 ml-[3px] border-l border-ink/22 max-[560px]:hidden">
              schema&nbsp;→&nbsp;diagram
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-[7px] font-semibold text-sm rounded-[2px] px-[15px] py-[9px] border-[1.5px] border-ink bg-transparent text-ink transition-[transform,box-shadow,background] duration-150 cursor-pointer motion-reduce:transition-none hover:bg-taupe"
            >
              <ArrowLeft size={16} strokeWidth={2.2} aria-hidden="true" />
              Connections
            </Link>
            <Link href="/design/new" className={NEW_DESIGN_LINK}>
              <Plus size={17} strokeWidth={2.2} aria-hidden="true" />
              New design
            </Link>
          </div>
        </header>

        <section
          className={
            "mb-[26px] " +
            (mounted
              ? "animate-fade [animation-delay:0.06s] motion-reduce:animate-none"
              : "opacity-0")
          }
        >
          <h1 className="text-[38px] font-bold tracking-[-0.02em] mb-2 max-[560px]:text-[30px]">
            Schema designs
          </h1>
          <p className="max-w-[56ch] mb-5 text-[15.5px] leading-[1.55] text-ink/55">
            Build a schema from scratch, or pick up a saved design. Use Save in
            the editor to keep your tables and relationships in CARDINAL.
          </p>
          <div className="flex items-center gap-[14px]">
            <span className="text-clay flex items-center" aria-hidden="true">
              <CardinalityGlyph size={18} />
            </span>
            <span className="flex-1 h-px bg-ink/22" />
            <span className="font-mono text-xs text-ink/55 whitespace-nowrap">
              {isPending
                ? "Loading designs…"
                : error
                  ? "Design library"
                  : `${designs.length} ${designs.length === 1 ? "design" : "designs"} saved`}
            </span>
          </div>
        </section>

        {isPending ? (
          <p role="status" className="flex items-center gap-2 font-mono text-[13px] text-ink/55">
            <Spinner /> Loading designs…
          </p>
        ) : error ? (
          <div role="alert">
            <p className="flex items-center gap-2 font-mono text-[13px] text-clay">
              <AlertCircle size={15} strokeWidth={2.2} aria-hidden="true" />
              {error.message}
            </p>
            <Button variant="ghost" className="mt-3" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        ) : designs.length === 0 ? (
          <div className="border-[1.5px] border-dashed border-ink/22 rounded-[4px] px-6 py-14 text-center flex flex-col items-center">
            <span className="text-clay mb-2" aria-hidden="true">
              <CrowsFoot size={44} strokeWidth={1.4} />
            </span>
            <h2 className="text-[22px] font-bold my-1.5">No schema designs yet</h2>
            <p className="max-w-[44ch] mb-[22px] text-ink/55 leading-[1.55]">
              Add tables, connect their columns, and save your schema to see it
              here. An existing browser draft is available under New design.
            </p>
            <Link href="/design/new" className={NEW_DESIGN_LINK}>
              <Plus size={17} strokeWidth={2.2} aria-hidden="true" />
              New design
            </Link>
          </div>
        ) : (
          <ul className="list-none grid gap-[18px] grid-cols-[repeat(auto-fill,minmax(268px,1fr))] max-[560px]:grid-cols-1">
            {designs.map((design, index) => (
              <li
                key={design.id}
                className={
                  "min-w-0 " +
                  (mounted
                    ? "animate-rise motion-reduce:animate-none motion-reduce:opacity-100"
                    : "opacity-0")
                }
                style={mounted ? { animationDelay: `${(0.12 + Math.min(index, 12) * 0.05).toFixed(2)}s` } : undefined}
              >
                <article className="h-full bg-paper border-[1.5px] border-ink rounded-[3px] overflow-hidden transition-[box-shadow,transform] duration-150 motion-reduce:transition-none hover:shadow-soft">
                  <header className="flex items-center justify-between gap-[10px] px-[14px] py-3 bg-taupe border-b-[1.5px] border-ink">
                    <h2 className="min-w-0 font-bold text-[15.5px] tracking-[-0.01em] truncate" title={design.name}>
                      {design.name}
                    </h2>
                    <span className="shrink-0 font-mono text-[11px] font-medium text-ink px-[7px] py-0.5 border border-ink/22 rounded-[2px] bg-paper">
                      design
                    </span>
                  </header>
                  <dl className="py-1">
                    {[
                      ["revision", String(design.revision)],
                      ["created", new Date(design.created_at).toLocaleDateString()],
                      ["updated", new Date(design.updated_at).toLocaleDateString()],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between gap-3 px-[14px] py-[7px] border-b border-dashed border-ink/14 last:border-b-0">
                        <dt className="font-mono text-[11px] text-ink/55 tracking-[0.02em]">{label}</dt>
                        <dd className="font-mono text-[12.5px] text-ink truncate max-w-[60%] text-right">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <footer className="flex items-center justify-between gap-2 pt-[11px] pr-3 pb-[11px] pl-[14px] border-t-[1.5px] border-ink">
                    <Link
                      href={`/design/${design.id}`}
                      aria-label={`Open ${design.name}`}
                      className="inline-flex items-center gap-[5px] font-semibold text-[13.5px] text-ink bg-transparent border-[1.5px] border-ink rounded-[2px] px-[13px] py-1.5 cursor-pointer transition-colors duration-[140ms] motion-reduce:transition-none hover:bg-clay hover:border-clay hover:text-paper focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(177_116_87/0.3)]"
                    >
                      Open <ArrowUpRight size={15} strokeWidth={2.2} aria-hidden="true" />
                    </Link>
                    <CrowsFoot size={20} strokeWidth={1.5} className="text-ink/30" aria-hidden="true" />
                  </footer>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
