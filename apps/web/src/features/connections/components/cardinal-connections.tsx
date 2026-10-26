"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Pencil, AlertCircle } from "lucide-react";
import { Button, ConfirmDialog, Spinner } from "@/components/ui";
import { CrowsFoot, CardinalityGlyph } from "@/components/crows-foot";
import { useToast } from "@/components/toast-provider";
import type { Connection, Draft, ConnectionRequest } from "../api/types";
import {
  useConnections,
  useCreateConnection,
  useUpdateConnection,
  useDeleteConnection,
} from "../api/use-connections";
import { toConnection, toRequest } from "../api/to-view-model";
import { ConnectionCard } from "./connection-card";
import { ConnectionModal } from "./connection-modal";
import { EmptyState } from "./empty-state";

/* ------------------------------------------------------------------ *
 * CARDINAL — connections page
 * Create / select / edit / delete database connections, each drawn as
 * an ERD entity box. GET/POST/PATCH/DELETE /api/connections are wired
 * (TanStack Query). Styling tokens live in src/app/globals.css @theme.
 * ------------------------------------------------------------------ */

type Modal = { mode: "create" | "edit"; draft: Draft } | null;

const errText = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong";

export default function CardinalConnections() {
  const { data, isPending, isError } = useConnections();
  const toast = useToast();

  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [deleteTarget, setDeleteTarget] = useState<Connection | null>(null);
  const [mounted, setMounted] = useState(false);

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
          toast(`Linked ${row.name ?? draft.name}`);
          setModal(null);
        },
        onError: (e) => toast(errText(e)),
      });
    } else {
      const patch: Partial<ConnectionRequest> = { ...body };
      // blank password on edit = keep the stored one
      if (!draft.password) delete patch.password;
      updateM.mutate(
        { id: Number(draft.id), body: patch },
        {
          onSuccess: () => {
            toast(`Saved ${draft.name}`);
            setModal(null);
          },
          onError: (e) => toast(errText(e)),
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
        toast(`Removed ${name}`);
        setDeleteTarget(null);
      },
      onError: (e) => toast(errText(e)),
    });
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
          <div className="flex items-center gap-2">
            <Link
              href="/design"
              className="inline-flex items-center gap-[7px] font-semibold text-sm rounded-[2px] px-[15px] py-[9px] border-[1.5px] border-ink bg-transparent text-ink transition-[transform,box-shadow,background] duration-150 cursor-pointer motion-reduce:transition-none hover:bg-taupe"
            >
              <Pencil size={16} strokeWidth={2.2} />
              Design ERD
            </Link>
            <Button onClick={openCreate}>
              <Plus size={17} strokeWidth={2.2} />
              New connection
            </Button>
          </div>
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
            <Spinner />
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
        <ConfirmDialog
          title={`Remove ${deleteTarget.name}?`}
          body="CARDINAL forgets the saved credentials and drops it from your list. The database itself isn't touched."
          confirmLabel="Remove"
          destructive
          loading={deleteM.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
