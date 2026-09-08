"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type MouseEvent,
} from "react";
import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen, Pin } from "lucide-react";
import { IconButton } from "@/components/ui";
import { CrowsFoot } from "@/components/crows-foot";
import { useToast } from "@/components/toast-provider";
import type { Engine, ErdSchema, ErdTable } from "../api/types";
import { BOX_W, clamp, tableHeight } from "../utils/geometry";
import { ErdNode } from "./erd-node";
import { ErdEdge } from "./erd-edge";
import { ErdSidebar } from "./erd-sidebar";
import { ErdToolbar } from "./erd-toolbar";
import { ErdLegend } from "./erd-legend";

const ENGINE_LABEL: Record<Engine, string> = {
  postgresql: "postgres",
  mysql: "mysql",
};

type DragState =
  | {
      kind: "entity";
      id: string;
      sx: number;
      sy: number;
      ox: number;
      oy: number;
      moved: boolean;
    }
  | {
      kind: "pan";
      sx: number;
      sy: number;
      otx: number;
      oty: number;
      moved: boolean;
    }
  | null;

export function ErdView({
  schema,
  connectionName,
  engine,
}: {
  schema: ErdSchema;
  connectionName: string;
  engine?: Engine;
}) {
  const toast = useToast();

  const [tables, setTables] = useState<ErdTable[]>(() => schema.tables);
  const [edges] = useState(schema.edges);
  const [view, setView] = useState({ tx: 40, ty: 40, k: 0.9 });
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [animate, setAnimate] = useState(false);
  const [sidebarPinned, setSidebarPinned] = useState(true);
  const [sidebarPeek, setSidebarPeek] = useState(false);
  const [reduce] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const canvasRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState>(null);

  const byId = useCallback(
    (id: string) => tables.find((t) => t.id === id),
    [tables],
  );

  /* --- fit everything into view --- */
  const fit = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    tables.forEach((t) => {
      minX = Math.min(minX, t.x);
      minY = Math.min(minY, t.y);
      maxX = Math.max(maxX, t.x + BOX_W);
      maxY = Math.max(maxY, t.y + tableHeight(t));
    });
    const pad = 70;
    const k = Math.min(
      (cw - pad * 2) / (maxX - minX),
      (ch - pad * 2) / (maxY - minY),
      1.25,
    );
    const tx = (cw - (maxX - minX) * k) / 2 - minX * k;
    const ty = (ch - (maxY - minY) * k) / 2 - minY * k;
    setAnimate(true);
    setView({ tx, ty, k });
  }, [tables]);

  useEffect(() => {
    const id = requestAnimationFrame(fit);
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fit once on mount, not on every drag
  }, []);

  /* --- wheel zoom (manual listener so preventDefault works) --- */
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey && Math.abs(e.deltaY) < 4) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      setAnimate(false);
      setView((v) => {
        const factor = e.deltaY < 0 ? 1.08 : 0.925;
        const k = clamp(v.k * factor, 0.35, 2);
        const wx = (mx - v.tx) / v.k;
        const wy = (my - v.ty) / v.k;
        return { k, tx: mx - wx * k, ty: my - wy * k };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  /* --- zoom buttons --- */
  const zoomBy = (factor: number) => {
    const el = canvasRef.current;
    const cw = el ? el.clientWidth / 2 : 0;
    const ch = el ? el.clientHeight / 2 : 0;
    setAnimate(true);
    setView((v) => {
      const k = clamp(v.k * factor, 0.35, 2);
      const wx = (cw - v.tx) / v.k;
      const wy = (ch - v.ty) / v.k;
      return { k, tx: cw - wx * k, ty: ch - wy * k };
    });
  };

  /* --- drag: entities move, background pans --- */
  const startEntityDrag = (e: MouseEvent, t: ErdTable) => {
    e.stopPropagation();
    setSelected(t.id);
    drag.current = {
      kind: "entity",
      id: t.id,
      sx: e.clientX,
      sy: e.clientY,
      ox: t.x,
      oy: t.y,
      moved: false,
    };
  };
  const startPan = (e: MouseEvent) => {
    if (e.button !== 0) return;
    drag.current = {
      kind: "pan",
      sx: e.clientX,
      sy: e.clientY,
      otx: view.tx,
      oty: view.ty,
      moved: false,
    };
  };

  useEffect(() => {
    const move = (e: globalThis.MouseEvent) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.sx;
      const dy = e.clientY - d.sy;
      if (!d.moved && Math.hypot(dx, dy) > 3) {
        d.moved = true;
        setAnimate(false);
      }
      if (!d.moved) return;
      if (d.kind === "entity") {
        setTables((ts) =>
          ts.map((t) =>
            t.id === d.id
              ? { ...t, x: d.ox + dx / view.k, y: d.oy + dy / view.k }
              : t,
          ),
        );
      } else {
        setView((v) => ({ ...v, tx: d.otx + dx, ty: d.oty + dy }));
      }
    };
    const up = () => {
      const d = drag.current;
      if (d && !d.moved && d.kind === "pan") setSelected(null);
      drag.current = null;
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [view.k]);

  /* --- selection relationships --- */
  const related = new Set<string>();
  const activeCols: Record<string, Set<string>> = {};
  if (selected) {
    edges.forEach((ed) => {
      if (ed.from.table === selected || ed.to.table === selected) {
        related.add(ed.from.table);
        related.add(ed.to.table);
        (activeCols[ed.from.table] ??= new Set()).add(ed.from.col);
        (activeCols[ed.to.table] ??= new Set()).add(ed.to.col);
      }
    });
  }
  const relCount = selected
    ? edges.filter((e) => e.from.table === selected || e.to.table === selected)
        .length
    : 0;

  const focusTable = (t: ErdTable) => {
    setSelected(t.id);
    const el = canvasRef.current;
    if (!el) return;
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    setAnimate(true);
    setView((v) => ({
      k: v.k,
      tx: cw / 2 - (t.x + BOX_W / 2) * v.k,
      ty: ch / 2 - (t.y + tableHeight(t) / 2) * v.k,
    }));
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden text-ink font-sans bg-paper antialiased">
      {/* top bar */}
      <header className="flex items-center justify-between gap-4 px-[18px] py-[11px] border-b-[1.5px] border-ink bg-paper z-[5]">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href="/"
            aria-label="Back to connections"
            title="Connections"
            className="flex items-center gap-2.5 shrink-0 rounded-[3px] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(177_116_87/0.14)]"
          >
            <span className="grid place-items-center w-[34px] h-[34px] text-paper bg-clay border-[1.5px] border-ink rounded-[3px] shadow-[2.5px_2.5px_0_var(--color-ink)] transition-transform motion-reduce:transition-none hover:-translate-x-px hover:-translate-y-px">
              <CrowsFoot size={24} strokeWidth={1.9} />
            </span>
            <span className="font-extrabold text-lg tracking-[0.13em] max-[720px]:hidden">
              CARDINAL
            </span>
          </Link>
          <nav
            className="flex items-center gap-[9px] min-w-0"
            aria-label="Breadcrumb"
          >
            <span className="text-ink/22 text-[17px]">/</span>
            <span className="font-mono text-[13px] text-ink whitespace-nowrap overflow-hidden text-ellipsis">
              {connectionName}
            </span>
            {engine && (
              <span className="shrink-0 font-mono text-[10.5px] font-medium text-ink px-[7px] py-0.5 border border-ink/22 rounded-[2px] bg-paper">
                {ENGINE_LABEL[engine]}
              </span>
            )}
          </nav>
        </div>

        <ErdToolbar
          zoom={view.k}
          onZoomIn={() => zoomBy(1.15)}
          onZoomOut={() => zoomBy(1 / 1.15)}
          onFit={fit}
          onSync={() => toast(`Re-synced ${connectionName}`)}
          onExport={() => toast(`Exported ${schema.schema}.svg`)}
        />
      </header>

      <div className="relative flex flex-1 min-h-0">
        {sidebarPinned && (
          <ErdSidebar
            tables={tables}
            edges={edges}
            selected={selected}
            relCount={relCount}
            query={query}
            onQuery={setQuery}
            onPick={focusTable}
            headerAction={
              <IconButton
                onClick={() => setSidebarPinned(false)}
                aria-label="Collapse sidebar"
                title="Collapse"
              >
                <PanelLeftClose size={15} />
              </IconButton>
            }
          />
        )}

        {!sidebarPinned && (
          <div
            className="absolute left-0 top-0 bottom-0 z-20 w-9"
            onMouseEnter={() => setSidebarPeek(true)}
            onMouseLeave={() => setSidebarPeek(false)}
          >
            <button
              className="absolute left-1.5 top-4 z-10 grid place-items-center w-7 h-9 bg-paper border-[1.5px] border-ink rounded-[2px] shadow-[2px_2px_0_var(--color-ink)] hover:bg-taupe cursor-pointer"
              onClick={() => {
                setSidebarPinned(true);
                setSidebarPeek(false);
              }}
              aria-label="Show tables"
              aria-expanded={sidebarPeek}
            >
              <PanelLeftOpen size={15} />
            </button>

            <div
              className={
                "absolute left-0 top-0 h-full transition-transform duration-200 motion-reduce:transition-none shadow-[6px_0_0_rgb(74_73_71/0.14)] " +
                (sidebarPeek
                  ? "translate-x-0"
                  : "-translate-x-full pointer-events-none")
              }
            >
              <ErdSidebar
                tables={tables}
                edges={edges}
                selected={selected}
                relCount={relCount}
                query={query}
                onQuery={setQuery}
                onPick={focusTable}
                headerAction={
                  <IconButton
                    onClick={() => {
                      setSidebarPinned(true);
                      setSidebarPeek(false);
                    }}
                    aria-label="Pin sidebar"
                    title="Pin"
                  >
                    <Pin size={14} />
                  </IconButton>
                }
              />
            </div>
          </div>
        )}

        {/* canvas */}
        <div
          ref={canvasRef}
          className="relative flex-1 overflow-hidden cursor-grab active:cursor-grabbing bg-paper bg-[radial-gradient(rgb(74_73_71/0.08)_1px,transparent_1.4px)] [background-size:24px_24px]"
          onMouseDown={startPan}
        >
          <div
            className="absolute top-0 left-0 origin-top-left will-change-transform"
            style={{
              transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.k})`,
              transition:
                animate && !reduce
                  ? "transform .34s cubic-bezier(.2,.8,.2,1)"
                  : "none",
            }}
          >
            <svg
              className="absolute top-0 left-0 overflow-visible pointer-events-none"
              width="2600"
              height="1400"
              aria-hidden="true"
            >
              {edges.map((ed) => {
                const touch =
                  ed.from.table === selected || ed.to.table === selected;
                const state = !selected ? "idle" : touch ? "active" : "dim";
                return (
                  <ErdEdge key={ed.id} edge={ed} byId={byId} state={state} />
                );
              })}
            </svg>

            {tables.map((t) => {
              const dimmed =
                !!selected && !related.has(t.id) && selected !== t.id;
              return (
                <ErdNode
                  key={t.id}
                  table={t}
                  selected={selected === t.id}
                  dimmed={dimmed}
                  activeCols={activeCols[t.id]}
                  onNodeDown={(e) => {
                    e.stopPropagation();
                    setSelected(t.id);
                  }}
                  onHeadDown={(e) => startEntityDrag(e, t)}
                />
              );
            })}
          </div>

          <ErdLegend />
        </div>
      </div>
    </div>
  );
}
