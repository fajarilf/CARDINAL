"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";
import type {
  Connection,
  Draft,
  Engine,
  ConnectionRequest,
} from "../api/types";
import {
  useConnections,
  useCreateConnection,
  useUpdateConnection,
  useDeleteConnection,
} from "../api/use-connections";
import { toConnection, toRequest } from "../api/to-view-model";

/* ------------------------------------------------------------------ *
 * CARDINAL — connections page
 * Initial screen: create / select / edit / delete database connections.
 * Each connection is drawn as an ERD entity box; the crow's-foot mark
 * (one CARDINAL -> many connections) is the recurring motif.
 *
 * GET/POST/PATCH/DELETE /api/connections are wired (TanStack Query).
 * Styling is Tailwind; design tokens (paper/taupe/clay/ink, brutal
 * shadows, cd* keyframes) live in src/app/globals.css @theme.
 * ------------------------------------------------------------------ */

type Modal = { mode: "create" | "edit"; draft: Draft } | null;
type TestState = { state: "idle" | "testing" | "ok" | "fail"; msg: string };

const errText = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong";

const DEFAULT_PORT: Record<Engine, string> = {
  postgresql: "5432",
  mysql: "3306",
};
const ENGINE_LABEL: Record<Engine, string> = {
  postgresql: "postgres",
  mysql: "mysql",
};

/* --------------------------- shared classes --------------------------- */

const BTN_BASE =
  "inline-flex items-center gap-[7px] font-semibold text-sm rounded-[2px] px-[15px] py-[9px] border-[1.5px] border-ink transition-[transform,box-shadow,background] duration-150 cursor-pointer motion-reduce:transition-none";
const BTN_PRIMARY =
  BTN_BASE +
  " bg-clay text-paper shadow-brutal hover:-translate-x-px hover:-translate-y-px hover:shadow-brutal-lg active:translate-x-px active:translate-y-px active:shadow-brutal-sm";
const BTN_GHOST =
  BTN_BASE +
  " bg-transparent text-ink hover:bg-taupe disabled:opacity-50 disabled:cursor-default";
const BTN_QUIET =
  BTN_BASE +
  " bg-transparent border-transparent text-ink/55 hover:text-ink hover:bg-taupe";
const BTN_DANGER =
  BTN_BASE +
  " bg-ink text-paper shadow-clay-btn hover:-translate-x-px hover:-translate-y-px hover:shadow-clay";

const ICON_BTN =
  "grid place-items-center w-[31px] h-[31px] bg-transparent border border-transparent rounded-[2px] text-ink/55 transition-colors duration-[140ms] cursor-pointer motion-reduce:transition-none";

const INPUT =
  "font-mono text-[13px] text-ink bg-paper border-[1.5px] border-ink/22 rounded-[2px] px-[11px] py-[9px] w-full transition-[border-color,box-shadow] duration-[140ms] placeholder:text-ink/22 focus:outline-none focus:border-clay focus:shadow-[0_0_0_3px_rgb(177_116_87/0.14)] motion-reduce:transition-none";
const LABEL = "font-mono text-[11px] text-ink/55 tracking-[0.03em]";

/* ----------------------------- icons ----------------------------- */

// Crow's-foot "many" mark — the brand glyph.
function CrowsFoot({
  size = 22,
  className = "",
  strokeWidth = 1.75,
}: {
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2 12h9" />
      <path d="M11 12l10-6.5" />
      <path d="M11 12h10" />
      <path d="M11 12l10 6.5" />
    </svg>
  );
}

// A one-to-many rule terminal: a short line with a "one" tick and a crow's foot.
function CardinalityGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size * 2.1}
      height={size}
      viewBox="0 0 42 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 10h9" />
      <path d="M8 4.5v11" />
      <path d="M24 10h6" />
      <path d="M30 10l10-6" />
      <path d="M30 10h10" />
      <path d="M30 10l10 6" />
    </svg>
  );
}

/* ----------------------------- app ------------------------------- */

export default function CardinalConnections() {
  const { data, isPending, isError } = useConnections();

  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [deleteTarget, setDeleteTarget] = useState<Connection | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const createM = useCreateConnection();
  const updateM = useUpdateConnection();
  const deleteM = useDeleteConnection();

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // ponytail: bridge fetched rows into the existing local-state machine that
  // create/edit/delete already drive (replacing it with a server overlay is the
  // next pass). React's "adjust state when data changes" pattern — setState
  // during render, guarded by the previous data value. No effect.
  const [seenData, setSeenData] = useState<typeof data>(undefined);
  if (data && data !== seenData) {
    setSeenData(data);
    setConnections(data.map(toConnection));
  }

  const showToast = (msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const openCreate = () =>
    setModal({
      mode: "create",
      draft: {
        name: "",
        engine: "postgresql",
        host: "",
        port: "5432",
        database: "",
        user: "",
        password: "",
      },
    });

  const openEdit = (conn: Connection) =>
    // ponytail: cast drops the non-editable fields (tables/lastSynced/current); the modal only reads Draft keys
    setModal({ mode: "edit", draft: { ...conn, password: "" } as Draft });

  const saveConnection = (draft: Draft) => {
    const body = toRequest(draft);
    if (modal?.mode === "create") {
      createM.mutate(body, {
        onSuccess: (row) => {
          setSelectedId(String(row.id));
          showToast(`Linked ${row.name ?? draft.name}`);
          setModal(null);
        },
        onError: (e) => showToast(errText(e)),
      });
    } else {
      const patch: Partial<ConnectionRequest> = { ...body };
      // blank password on edit = keep the stored one
      if (!draft.password) delete patch.password;
      updateM.mutate(
        { id: Number(draft.id), body: patch },
        {
          onSuccess: () => {
            showToast(`Saved ${draft.name}`);
            setModal(null);
          },
          onError: (e) => showToast(errText(e)),
        },
      );
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const { id, name } = deleteTarget;
    deleteM.mutate(Number(id), {
      onSuccess: () => {
        if (selectedId === id) setSelectedId(null);
        showToast(`Removed ${name}`);
        setDeleteTarget(null);
      },
      onError: (e) => showToast(errText(e)),
    });
  };

  const openDiagram = (conn: Connection) => {
    setConnections((cs) =>
      cs.map((c) => ({ ...c, current: c.id === conn.id })),
    );
    setSelectedId(conn.id);
    showToast(`Drawing the diagram for ${conn.name}…`);
  };

  return (
    <div className="min-h-screen bg-paper text-ink font-sans antialiased [text-rendering:optimizeLegibility] bg-[radial-gradient(rgb(74_73_71/0.08)_1px,transparent_1.4px)] [background-size:24px_24px] [background-position:-1px_-1px]">
      <div className="mx-auto max-w-[1120px] px-[30px] pt-[34px] pb-[90px]">
        {/* top bar */}
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
          <button className={BTN_PRIMARY} onClick={openCreate}>
            <Plus size={17} strokeWidth={2.2} />
            New connection
          </button>
        </header>

        {/* section intro */}
        <section
          className={
            "mb-[26px] " +
            (mounted
              ? "animate-fade [animation-delay:0.06s] motion-reduce:animate-none"
              : "opacity-0")
          }
        >
          <h1 className="text-[38px] font-bold tracking-[-0.02em] mb-2 max-[560px]:text-[30px]">
            Connections
          </h1>
          <p className="max-w-[56ch] mb-5 text-[15.5px] leading-[1.55] text-ink/55">
            Open a database to see its diagram, or link a new one and CARDINAL
            maps the schema for you.
          </p>
          <div className="flex items-center gap-[14px]">
            <span className="text-clay flex items-center">
              <CardinalityGlyph size={18} />
            </span>
            <span className="flex-1 h-px bg-ink/22" />
            <span className="font-mono text-xs text-ink/55 whitespace-nowrap">
              {connections.length}{" "}
              {connections.length === 1 ? "database" : "databases"} linked
            </span>
          </div>
        </section>

        {/* grid */}
        {isPending ? (
          <p className="flex items-center gap-2 font-mono text-[13px] text-ink/55">
            <Loader2
              size={15}
              className="animate-spin-slow motion-reduce:animate-none"
            />
            Loading connections…
          </p>
        ) : isError ? (
          <p className="flex items-center gap-2 font-mono text-[13px] text-clay">
            <AlertCircle size={15} strokeWidth={2.2} />
            Couldn&rsquo;t reach the API. Is it running on :3333?
          </p>
        ) : connections.length === 0 ? (
          <EmptyState onAdd={openCreate} />
        ) : (
          <ul className="list-none grid gap-[18px] grid-cols-[repeat(auto-fill,minmax(268px,1fr))] max-[560px]:grid-cols-1">
            {connections.map((conn, i) => (
              <li
                key={conn.id}
                className={
                  "min-w-0 " +
                  (mounted
                    ? "animate-rise motion-reduce:animate-none motion-reduce:opacity-100"
                    : "opacity-0")
                }
                style={
                  mounted
                    ? { animationDelay: `${(0.12 + i * 0.05).toFixed(2)}s` }
                    : undefined
                }
              >
                <ConnectionCard
                  conn={conn}
                  selected={conn.id === selectedId}
                  onSelect={() => setSelectedId(conn.id)}
                  onOpen={() => openDiagram(conn)}
                  onEdit={() => openEdit(conn)}
                  onDelete={() => setDeleteTarget(conn)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {modal && (
        <ConnectionModal
          mode={modal.mode}
          initial={modal.draft}
          saving={createM.isPending || updateM.isPending}
          onClose={() => setModal(null)}
          onSave={saveConnection}
        />
      )}

      {deleteTarget && (
        <DeleteDialog
          conn={deleteTarget}
          deleting={deleteM.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}

      <Toast msg={toast} />
    </div>
  );
}

/* ------------------------- connection card ----------------------- */

function ConnectionCard({
  conn,
  selected,
  onSelect,
  onOpen,
  onEdit,
  onDelete,
}: {
  conn: Connection;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const rows: [string, string][] = [
    ["host", conn.host || "—"],
    ["database", conn.database || "—"],
    ["tables", conn.tables == null ? "—" : String(conn.tables)],
    ["synced", conn.lastSynced],
  ];

  return (
    <div
      className={
        "bg-paper border-[1.5px] border-ink rounded-[3px] overflow-hidden outline-none cursor-pointer transition-[box-shadow,transform] duration-150 motion-reduce:transition-none focus-visible:shadow-[0_0_0_3px_rgb(177_116_87/0.14)] " +
        (selected ? "shadow-clay hover:shadow-clay" : "hover:shadow-soft")
      }
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {/* entity header */}
      <div className="flex items-center justify-between gap-[10px] px-[14px] py-3 bg-taupe border-b-[1.5px] border-ink">
        <div className="flex items-center gap-[9px] min-w-0">
          <span className="font-bold text-[15.5px] tracking-[-0.01em] whitespace-nowrap overflow-hidden text-ellipsis">
            {conn.name}
          </span>
          {conn.current && (
            <span
              className="inline-flex items-center gap-1 shrink-0 font-mono text-[10px] text-clay"
              title="Currently open diagram"
            >
              <CrowsFoot size={13} strokeWidth={2} /> current
            </span>
          )}
        </div>
        <span className="shrink-0 font-mono text-[11px] font-medium text-ink px-[7px] py-0.5 border border-ink/22 rounded-[2px] bg-paper">
          {ENGINE_LABEL[conn.engine]}
        </span>
      </div>

      {/* attribute rows — reads like an ERD entity's fields */}
      <dl className="py-1">
        {rows.map(([k, v]) => (
          <div
            className="flex items-center justify-between gap-3 px-[14px] py-[7px] border-b border-dashed border-ink/14 last:border-b-0"
            key={k}
          >
            <dt className="font-mono text-[11px] text-ink/55 tracking-[0.02em]">
              {k}
            </dt>
            <dd className="font-mono text-[12.5px] text-ink whitespace-nowrap overflow-hidden text-ellipsis max-w-[60%] text-right">
              {v}
            </dd>
          </div>
        ))}
      </dl>

      {/* action footer */}
      <div
        className="flex items-center justify-between gap-2 pt-[11px] pr-3 pb-[11px] pl-[14px] border-t-[1.5px] border-ink"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="inline-flex items-center gap-[5px] font-semibold text-[13.5px] text-ink bg-transparent border-[1.5px] border-ink rounded-[2px] px-[13px] py-1.5 cursor-pointer transition-colors duration-[140ms] motion-reduce:transition-none hover:bg-clay hover:border-clay hover:text-paper"
          onClick={onOpen}
        >
          Open <ArrowUpRight size={15} strokeWidth={2.2} />
        </button>
        <div className="flex gap-1">
          <button
            className={
              ICON_BTN + " hover:text-ink hover:bg-taupe hover:border-ink/22"
            }
            onClick={onEdit}
            aria-label={`Edit ${conn.name}`}
            title="Edit"
          >
            <Pencil size={15} strokeWidth={1.9} />
          </button>
          <button
            className={
              ICON_BTN +
              " hover:text-clay hover:bg-clay/[0.14] hover:border-transparent"
            }
            onClick={onDelete}
            aria-label={`Delete ${conn.name}`}
            title="Delete"
          >
            <Trash2 size={15} strokeWidth={1.9} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- empty state ------------------------- */

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="border-[1.5px] border-dashed border-ink/22 rounded-[4px] px-6 py-14 text-center flex flex-col items-center">
      <span className="text-clay mb-2" aria-hidden="true">
        <CrowsFoot size={44} strokeWidth={1.4} />
      </span>
      <h2 className="text-[22px] font-bold my-1.5">No databases linked yet</h2>
      <p className="max-w-[44ch] mb-[22px] text-ink/55 leading-[1.55]">
        Connect a MySQL or PostgreSQL database and CARDINAL introspects the
        schema into a diagram.
      </p>
      <button className={BTN_PRIMARY} onClick={onAdd}>
        <Plus size={17} strokeWidth={2.2} />
        New connection
      </button>
    </div>
  );
}

/* --------------------------- modal form -------------------------- */

function ConnectionModal({
  mode,
  initial,
  saving,
  onClose,
  onSave,
}: {
  mode: "create" | "edit";
  initial: Draft;
  saving?: boolean;
  onClose: () => void;
  onSave: (draft: Draft) => void;
}) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [test, setTest] = useState<TestState>({ state: "idle", msg: "" });
  const firstField = useRef<HTMLInputElement>(null);
  const testTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    firstField.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(testTimer.current);
    };
  }, [onClose]);

  const set = (k: keyof Draft, v: string) => {
    setDraft((d) => {
      const next = { ...d, [k]: v };
      if (k === "engine") {
        // fill the standard port if it's empty or still the other engine's default
        if (!d.port || d.port === DEFAULT_PORT[d.engine])
          next.port = DEFAULT_PORT[v as Engine];
      }
      return next;
    });
    setTest({ state: "idle", msg: "" });
    if (errors[k]) setErrors((e) => ({ ...e, [k]: false }));
  };

  const validate = () => {
    const e: Record<string, boolean> = {};
    if (!draft.name.trim()) e.name = true;
    if (!draft.host.trim()) e.host = true;
    if (!draft.database.trim()) e.database = true;
    if (!draft.user.trim()) e.user = true;
    if (!draft.port.trim()) e.port = true;
    if (mode === "create" && !draft.password) e.password = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const runTest = () => {
    if (!validate()) {
      setTest({ state: "fail", msg: "Fill in name, host and database first." });
      return;
    }
    setTest({ state: "testing", msg: "" });
    testTimer.current = setTimeout(() => {
      setTest({
        state: "ok",
        msg: `Reached ${draft.database} on ${draft.host}.`,
      });
    }, 950);
  };

  const submit = () => {
    if (!validate()) return;
    onSave(draft);
  };

  const testTone =
    test.state === "ok"
      ? "text-[#4d6b3f] border-[rgb(77_107_63/0.4)] bg-[rgb(77_107_63/0.08)]"
      : test.state === "fail"
        ? "text-clay border-[rgb(177_116_87/0.4)] bg-clay/[0.14]"
        : "text-ink/55";

  return (
    <div
      className="fixed inset-0 bg-ink/34 grid place-items-center p-5 z-40 [animation:cdFade_0.16s_ease_both] motion-reduce:animate-none"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-[468px] bg-paper border-[1.5px] border-ink rounded-[4px] shadow-modal animate-pop motion-reduce:animate-none"
        role="dialog"
        aria-modal="true"
        aria-label={mode === "create" ? "New connection" : "Edit connection"}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-[15px] border-b-[1.5px] border-ink bg-taupe">
          <div className="flex items-center gap-[9px] font-bold text-base text-ink">
            <CrowsFoot size={18} strokeWidth={2} />
            {mode === "create" ? "New connection" : "Edit connection"}
          </div>
          <button
            className={
              ICON_BTN + " hover:text-ink hover:bg-taupe hover:border-ink/22"
            }
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="pt-[18px] px-[18px] pb-1.5 flex flex-col gap-[14px]">
          <Field
            label="Connection name"
            error={errors.name}
            hint="How it shows up in your list"
          >
            <input
              ref={firstField}
              className={INPUT}
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="prod-core"
            />
          </Field>

          <div className="flex flex-col gap-1.5">
            <span className={LABEL}>Engine</span>
            <div
              className="inline-flex border-[1.5px] border-ink rounded-[2px] overflow-hidden w-fit"
              role="radiogroup"
              aria-label="Database engine"
            >
              {(["postgresql", "mysql"] as Engine[]).map((eng) => (
                <button
                  key={eng}
                  role="radio"
                  aria-checked={draft.engine === eng}
                  className={
                    "font-mono text-[12.5px] px-4 py-2 border-r-[1.5px] border-ink last:border-r-0 cursor-pointer " +
                    (draft.engine === eng
                      ? "bg-clay text-paper font-semibold"
                      : "bg-paper text-ink/55")
                  }
                  onClick={() => set("engine", eng)}
                >
                  {eng === "postgresql" ? "PostgreSQL" : "MySQL"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 max-[560px]:flex-col">
            <Field label="Host" error={errors.host} grow>
              <input
                className={INPUT}
                value={draft.host}
                onChange={(e) => set("host", e.target.value)}
                placeholder="10.0.4.12"
              />
            </Field>
            <Field label="Port" error={errors.port}>
              <input
                className={INPUT + " w-[88px] max-[560px]:w-full"}
                value={draft.port}
                onChange={(e) => set("port", e.target.value)}
                placeholder={DEFAULT_PORT[draft.engine]}
              />
            </Field>
          </div>

          <Field label="Database" error={errors.database}>
            <input
              className={INPUT}
              value={draft.database}
              onChange={(e) => set("database", e.target.value)}
              placeholder="core"
            />
          </Field>

          <div className="flex gap-3 max-[560px]:flex-col">
            <Field label="User" error={errors.user} grow>
              <input
                className={INPUT}
                value={draft.user}
                onChange={(e) => set("user", e.target.value)}
                placeholder="cardinal_ro"
              />
            </Field>
            <Field
              label="Password"
              error={errors.password}
              hint={
                mode === "edit"
                  ? "Leave blank to keep the current one"
                  : undefined
              }
              grow
            >
              <input
                className={INPUT}
                type="password"
                value={draft.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="••••••••"
              />
            </Field>
          </div>

          {test.state !== "idle" && (
            <div
              className={
                "flex items-center gap-[7px] font-mono text-xs px-[11px] py-[9px] rounded-[2px] border border-ink/22 " +
                testTone
              }
            >
              {test.state === "testing" && (
                <>
                  <Loader2
                    size={15}
                    className="animate-spin-slow motion-reduce:animate-none"
                  />{" "}
                  Testing connection…
                </>
              )}
              {test.state === "ok" && (
                <>
                  <Check size={15} strokeWidth={2.4} /> {test.msg}
                </>
              )}
              {test.state === "fail" && (
                <>
                  <AlertCircle size={15} strokeWidth={2.2} /> {test.msg}
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-[10px] px-[18px] py-4 mt-2 border-t border-ink/14">
          <button
            className={BTN_GHOST}
            onClick={runTest}
            disabled={test.state === "testing"}
          >
            Test connection
          </button>
          <div className="flex gap-2">
            <button className={BTN_QUIET} onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button className={BTN_PRIMARY} onClick={submit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2
                    size={15}
                    className="animate-spin-slow motion-reduce:animate-none"
                  />{" "}
                  Saving…
                </>
              ) : mode === "create" ? (
                "Save connection"
              ) : (
                "Save changes"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  error,
  hint,
  grow,
}: {
  label: string;
  children: React.ReactNode;
  error?: boolean;
  hint?: string;
  grow?: boolean;
}) {
  return (
    <label
      className={"flex flex-col gap-1.5" + (grow ? " flex-1 min-w-0" : "")}
    >
      <span className={LABEL}>
        {label}
        {error && <span className="text-clay"> — required</span>}
      </span>
      {children}
      {hint && !error && (
        <span className="text-[11.5px] text-ink/55">{hint}</span>
      )}
    </label>
  );
}

/* -------------------------- delete dialog ------------------------ */

function DeleteDialog({
  conn,
  deleting,
  onCancel,
  onConfirm,
}: {
  conn: Connection;
  deleting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    btn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 bg-ink/34 grid place-items-center p-5 z-40 [animation:cdFade_0.16s_ease_both] motion-reduce:animate-none"
      onMouseDown={onCancel}
    >
      <div
        className="w-full max-w-[400px] p-[22px] bg-paper border-[1.5px] border-ink rounded-[4px] shadow-modal animate-pop motion-reduce:animate-none"
        role="alertdialog"
        aria-modal="true"
        aria-label={`Remove ${conn.name}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="text-[19px] font-bold mb-2">Remove {conn.name}?</h2>
        <p className="mb-5 text-ink/55 text-sm leading-[1.55]">
          CARDINAL forgets the saved credentials and drops it from your list.
          The database itself isn&rsquo;t touched.
        </p>
        <div className="flex justify-end gap-2">
          <button className={BTN_QUIET} onClick={onCancel} disabled={deleting}>
            Cancel
          </button>
          <button
            ref={btn}
            className={BTN_DANGER}
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2
                size={15}
                className="animate-spin-slow motion-reduce:animate-none"
              />
            ) : (
              <Trash2 size={15} strokeWidth={2} />
            )}{" "}
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ toast ---------------------------- */

function Toast({ msg }: { msg: string | null }) {
  return (
    <div
      className={
        "fixed left-1/2 bottom-[26px] -translate-x-1/2 flex items-center gap-2 font-mono text-[12.5px] text-paper bg-ink border-[1.5px] border-ink px-[15px] py-2.5 rounded-[3px] shadow-clay-btn transition-transform duration-[280ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] z-50 pointer-events-none motion-reduce:transition-none [&_svg]:text-clay " +
        (msg ? "translate-y-0" : "translate-y-[140%]")
      }
      role="status"
      aria-live="polite"
    >
      {msg && (
        <>
          <CrowsFoot size={15} strokeWidth={2} /> {msg}
        </>
      )}
    </div>
  );
}
